<?php

declare(strict_types=1);

namespace Bga\Games\IsraeliWhistShahar\States;

use Bga\GameFramework\StateType;
use Bga\Games\IsraeliWhistShahar\Game;
// todo: do we need these imports? In the tutorial it worked without them
use Bga\Games\IsraeliWhistShahar\States\NewHand;

class EndHand extends \Bga\GameFramework\States\GameState
{
    public function __construct(protected Game $game)
    {
        parent::__construct($game, id: 40, type: StateType::GAME);
    }

    function onEnteringState()
    {
        // Calculate scores for each player
        $players = $this->game->loadPlayersBasicInfos();

        foreach ($players as $player_id => $player) {
            $sql = "SELECT tricks_taken, tricks_need FROM player WHERE player_id='$player_id'";
            $player_data = $this->game->getObjectFromDB($sql);

            $tricks_taken = $player_data["tricks_taken"];
            $tricks_need = $player_data["tricks_need"];

            $score = 0;
            if ($tricks_taken == $tricks_need) {
                // Success
                if ($tricks_taken == 0) {
                    $score = 50; // Special bonus for taking exactly 0 when betting 0
                } else {
                    $score = $tricks_taken * $tricks_taken + 10;
                }
            } else {
                // Failure
                $diff = abs($tricks_taken - $tricks_need);
                $score = -10 * $diff;
            }

            // Update player score
            $sql = "UPDATE player SET player_score = player_score + $score WHERE player_id='$player_id'";
            $this->game->DbQuery($sql);

            // Notify about points
            $this->game->notifyAllPlayers(
                "points",
                clienttranslate('${player_name} scores ${points} points'),
                [
                    "player_id" => $player_id,
                    "player_name" => $this->game->getPlayerNameById($player_id),
                    "points" => $score,
                ]
            );
        }

        // Reset tricks for next hand
        $sql = "UPDATE player SET tricks_taken = 0, tricks_need = 0";
        $this->game->DbQuery($sql);

        // Check if game should end (after certain number of rounds)
        $round = $this->game->getGameStateValue("round_number");
        if ($round >= 13) {
            // Game ends after 13 rounds
            return 99; // todo: check this actually hands the game
        } else {
            // Next round
            $this->game->setGameStateValue("round_number", $round + 1);
            $this->game->notifyAllPlayers(
                "newRound",
                clienttranslate('Round ${round_number}'),
                [
                    "round_number" => $round + 1,
                ]
            );
            return NewHand::class;
        }
    }
}
