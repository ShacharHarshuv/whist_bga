<?php

declare(strict_types=1);

namespace Bga\Games\israeliwhist\States;

use Bga\GameFramework\StateType;
use Bga\Games\israeliwhist\Game;

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
            $sql = "SELECT tricks_taken, contract FROM player WHERE player_id='$player_id'";
            $player_data = $this->game->getObjectFromDB($sql);

            $tricks_taken = $player_data["tricks_taken"];
            $contract = $player_data["contract"];

            $score = 0;
            if ($tricks_taken == $contract) {
                // Success
                if ($tricks_taken == 0) {
                    $score = 50; // Special bonus for taking exactly 0 when betting 0
                } else {
                    $score = $tricks_taken * $tricks_taken + 10;
                }
            } else {
                // Failure
                $diff = abs($tricks_taken - $contract);
                $score = -10 * $diff;
            }

            // Update player score
            $sql = "UPDATE player SET player_score = player_score + $score WHERE player_id='$player_id'";
            $this->game->DbQuery($sql);

            // Notify about points
            $this->notify->all(
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
        $sql = "UPDATE player SET tricks_taken = 0, contract = 0";
        $this->game->DbQuery($sql);

        // Check if game should end (after certain number of rounds)
        $round = $this->game->getGameStateValue("roundNumber");
        $numberOfRounds = $this->game->numberOfRounds;
        if ($round >= $numberOfRounds) {
            // Game ends after 13 rounds
            return 99; // todo: check this actually hands the game
        } else {
            // Next round
            $this->game->setGameStateValue("roundNumber", $round + 1);
            $this->notify->all(
                "newRound",
                clienttranslate('Round ${roundNumber}'),
                [
                    "roundNumber" => $round + 1,
                ]
            );
            return NewHand::class;
        }
    }
}
