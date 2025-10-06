<?php

declare(strict_types=1);

namespace Bga\Games\israeliwhistshahar\States;

use Bga\GameFramework\StateType;
use Bga\Games\israeliwhistshahar\Game;
use Bga\GameFramework\States\PossibleAction;

class PlayerBid extends \Bga\GameFramework\States\GameState
{
    public function __construct(protected Game $game)
    {
        parent::__construct(
            $game,
            id: 20,
            type: StateType::ACTIVE_PLAYER,
            description: clienttranslate(
                '${actplayer} must make a bid or pass'
            ),
            descriptionMyTurn: clienttranslate(
                '${you} must make a bid or pass ${currentBidDisplay}'
            )
        );
    }

    public function zombie(int $playerId)
    {
        $this->actPass($playerId);
    }

    public function getArgs(): array
    {
        $currentBidValue = $this->game->getGameStateValue("currentBidValue");
        $currentBidSuit = $this->game->getGameStateValue("currentBidSuit");

        return [
            "currentBidDisplay" =>
                $currentBidValue == 0
                    ? ""
                    : "(Current bid: " .
                        $this->game->values_label[$currentBidValue] . // todo: we need to reuse this?
                        $this->game->suits[$currentBidSuit]["emoji"] .
                        ")",
        ];
    }

    // TODO: check if the logic is implemented in Game.php and move it here

    #[PossibleAction]
    public function actPass(int $activePlayerId)
    {
        $this->game->DbQuery(
            "UPDATE player SET bid_value=-2 WHERE player_id='$activePlayerId'"
        );

        // todo: we probably don't need this if we track for each player?
        $passes = $this->game->getGameStateValue("numberOfPasses");
        $this->game->setGameStateValue("numberOfPasses", $passes + 1);

        $this->game->notify->all(
            "playerPass",
            clienttranslate('${player_name} passes'),
            [
                "player_id" => $activePlayerId,
                "player_name" => $this->game->getPlayerNameById(
                    $activePlayerId
                ),
            ]
        );

        return NextBidder::class;
    }

    #[PossibleAction]
    public function actBid(int $value, int $suit, int $activePlayerId)
    {
        // throw new \BgaUserException(
        //     "Not implemented: bid, {$value}, {$suit}, {$activePlayerId}"
        // );
        $currentBidValue = $this->game->getGameStateValue("currentBidValue");
        $currentBidSuit = $this->game->getGameStateValue("currentBidSuit");

        // TODO: after Frisch, this would be higher
        if ($value < 5) {
            throw new \BgaVisibleSystemException(
                clienttranslate("Bid value must be at least 5")
            );
        }

        if (!isBidHigher($currentBidSuit, $currentBidValue, $suit, $value)) {
            throw new \BgaVisibleSystemException(
                clienttranslate("Bid is not higher than the current bid")
            );
        }

        $this->game->DbQuery("
            UPDATE player
            SET bid_value = $value,
                bid_suit = $suit
            WHERE player_id = $activePlayerId
        ");

        // todo: do we need those?
        $this->game->setGameStateValue("currentBidValue", $value);
        $this->game->setGameStateValue("currentBidSuit", $suit);
        $this->game->setGameStateValue("currentBidPlayerId", $activePlayerId);
        $this->game->setGameStateValue("numberOfPasses", 0);

        // And notify
        $this->game->notify->all(
            "playerBid",
            clienttranslate('${player_name} bids ${bidDisplay}'),
            [
                "player_id" => $activePlayerId,
                "player_name" => $this->game->getPlayerNameById(
                    $activePlayerId
                ),
                "suit" => $suit,
                "value" => $value,
                "bidDisplay" =>
                    $this->game->values_label[$value] .
                    $this->game->suits[$suit]["emoji"],
            ]
        );

        return NextBidder::class;
    }
}

function isBidHigher(
    $currentBidSuit,
    $currentBidValue,
    $newBidSuit,
    $newBidValue
) {
    return $newBidValue >=
        $currentBidValue + ($newBidSuit > $currentBidSuit ? 1 : 0);
}
