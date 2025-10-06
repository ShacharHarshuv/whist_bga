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
            descriptionMyTurn: clienttranslate('${you} must make a bid or pass')
        );
    }

    public function zombie(int $playerId)
    {
        // We must implement this so BGA can auto play in the case a player becomes a zombie, but for this tutorial we won't handle this case
        throw new \BgaUserException(
            'Not implemented: zombie for player ${player_id}',
            args: [
                "player_id" => $playerId,
            ]
        );
    }

    // TODO: check if the logic is implemented in Game.php and move it here

    #[PossibleAction]
    public function actPass()
    {
        throw new \BgaUserException("Not implemented: pass");
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
