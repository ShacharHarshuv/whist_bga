<?php
declare(strict_types=1);

namespace Bga\Games\israeliwhist\States;

use Bga\GameFramework\StateType;
use Bga\Games\israeliwhist\Game;
use Bga\GameFramework\States\PossibleAction;
use Bga\Games\israeliwhist\States\TakeCards;

class EndClaim extends \Bga\GameFramework\States\GameState
{
    public function __construct(protected Game $game)
    {
        parent::__construct($game, id: 42, type: StateType::GAME);
    }

    function onEnteringState()
    {
        $claimingPlayerId = (int) $this->game->getGameStateValue(
            "claimingPlayerId"
        );
        $numberOfRemainingTricks = count(
            $this->game->deck->getPlayerHand($claimingPlayerId)
        );

        $this->game->DbQuery(
            "UPDATE player SET tricks_taken=tricks_taken+$numberOfRemainingTricks WHERE player_id='$claimingPlayerId'"
        );
        $this->notify->all(
            "claimAccepted",
            clienttranslate(
                '${player_name} claim for ${remaining_tricks} remaining tricks accepted'
            ),
            [
                "player_id" => $claimingPlayerId,
                "player_name" => $this->game->getPlayerNameById(
                    $claimingPlayerId
                ),
                "remaining_tricks" => $numberOfRemainingTricks,
            ]
        );
        return EndHand::class;
    }
}
