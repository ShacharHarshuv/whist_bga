<?php

declare(strict_types=1);

namespace Bga\Games\israeliwhist\States;

use Bga\GameFramework\StateType;
use Bga\Games\israeliwhist\Game;
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
        $currentBidValue = (int) $this->game->getGameStateValue(
            "currentBidValue"
        );
        $currentBidSuit = (int) $this->game->getGameStateValue(
            "currentBidSuit"
        );

        return [
            "currentBidDisplay" =>
                $currentBidValue == 0
                    ? ""
                    : "(Current bid: " .
                        $this->game->formatBid(
                            $currentBidValue,
                            $currentBidSuit
                        ) .
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
        $currentBidValue = $this->game->getGameStateValue("currentBidValue");
        $currentBidSuit = $this->game->getGameStateValue("currentBidSuit");

        // Minimum bid increases by 1 for each Frisch
        $frischCounter = $this->game->getGameStateValue("frischCounter");
        $minBid = 5 + $frischCounter;
        
        if ($value < $minBid) {
            throw new \BgaVisibleSystemException(
                clienttranslate("Bid value must be at least ${min_bid}"),
                [
                    "min_bid" => $minBid,
                ]
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

        // And notify
        $this->game->notify->all(
            "playerBid",
            clienttranslate('${player_name} bids ${bid_displayed}'),
            [
                "player_id" => $activePlayerId,
                "player_name" => $this->game->getPlayerNameById(
                    $activePlayerId
                ),
                "suit" => $suit,
                "value" => $value,
                "bid_displayed" => $this->game->formatBid($value, $suit),
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
        $currentBidValue + ($newBidSuit > $currentBidSuit ? 0 : 1);
}
