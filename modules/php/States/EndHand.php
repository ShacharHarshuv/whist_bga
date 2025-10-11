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

    function calculatePoints(int $taken, int $contract): int
    {
        if ($taken == $contract) {
            if ($contract == 0) {
                $contractsSum = $this->game->getGameStateValue("contractsSum");
                $isOver = $contractsSum > 13;
                return $isOver ? $this->game->tableOptions->get(101) : 50;
            }

            return $taken * $taken + 10;
        }

        $diff = abs($taken - $contract);

        if ($contract == 0) {
            return -50 + ($diff - 1) * 10;
        }

        $penalty = $this->game->tableOptions->get(102);
        return -1 * $penalty * $diff;
    }

    function onEnteringState()
    {
        $this->game->setGameStateValue("trumpSuit", 0);

        // Calculate scores for each player
        $players = $this->game->loadPlayersBasicInfos();
        $playerScores = [];

        foreach (array_keys($players) as $player_id) {
            $sql = "SELECT tricks_taken, contract FROM player WHERE player_id='$player_id'";
            $player_data = $this->game->getObjectFromDB($sql);

            $tricks_taken = $player_data["tricks_taken"];
            $contract = $player_data["contract"];

            $score = $this->calculatePoints(
                (int) $tricks_taken,
                (int) $contract
            );

            // Update player score
            $sql = "UPDATE player SET player_score = player_score + $score WHERE player_id='$player_id'";
            $this->game->DbQuery($sql);

            // Collect scoring data for notification
            $playerScores[] = [
                "player_id" => $player_id,
                "points" => $score,
            ];
        }

        // Send single notification with all players' points
        $this->notify->all(
            "points",
            clienttranslate("Points scored this round"),
            $playerScores
        );

        // Reset tricks for next hand
        $sql = "UPDATE player SET tricks_taken = 0, contract = 0";
        $this->game->DbQuery($sql);

        // Check if game should end (after certain number of rounds)
        $round = $this->game->getGameStateValue("roundNumber");
        $numberOfRounds = $this->game->getNumberOfRounds();
        if ($round >= $numberOfRounds) {
            // Game ends after 13 rounds
            return 99; // todo: check this actually ends the game
        } else {
            // Next round
            $this->game->setGameStateValue("roundNumber", $round + 1);
            return NewHand::class;
        }
    }
}
