<?php

declare(strict_types=1);

namespace Bga\Games\israeliwhistshahar\States;

use Bga\GameFramework\StateType;
use Bga\Games\israeliwhistshahar\Game;

class NextPlayer extends \Bga\GameFramework\States\GameState
{
    public function __construct(protected Game $game)
    {
        parent::__construct($game, id: 32, type: StateType::GAME);
    }

    function onEnteringState(): string
    {
        // Active next player OR end the trick and go to the next trick OR end the hand
        if ($this->game->deck->countCardInLocation("cardsontable") == 4) {
            // This is the end of the trick
            // figure out winner of trick
            $cards_on_table = $this->game->deck->getCardsInLocation(
                "cardsontable"
            );
            $best_value = 0;
            $best_value_player_id = null;
            $currenttrickSuit = $this->game->getGameStateValue("trickSuit");
            $currenttrumpSuit = $this->game->getGameStateValue(
                "currentBidSuit"
            );
            $best_trump_player_id = null;
            $best_trump = 0;

            foreach ($cards_on_table as $card) {
                // Note: type = card color
                if ($card["type"] == $currenttrickSuit) {
                    if (
                        $best_value_player_id === null ||
                        $card["type_arg"] > $best_value
                    ) {
                        $best_value_player_id = $card["location_arg"]; // Note: location_arg = player who played this card on table
                        $best_value = $card["type_arg"]; // Note: type_arg = value of the card
                    }
                } elseif ($card["type"] == $currenttrumpSuit) {
                    if (
                        $best_trump_player_id === null ||
                        $card["type_arg"] > $best_trump
                    ) {
                        $best_trump_player_id = $card["location_arg"]; // Note: location_arg = player who played this card on table
                        $best_trump = $card["type_arg"]; // Note: type_arg = value of the card
                    }
                }
            }
            if ($best_trump > 0) {
                $best_value_player_id = $best_trump_player_id;
            }

            // Active this player => he's the one who starts the next trick
            $this->game->gamestate->changeActivePlayer($best_value_player_id);

            // Move all cards to "cardswon" of the given player
            $this->game->deck->moveAllCardsInLocation(
                "cardsontable",
                "cardswon",
                null,
                $best_value_player_id
            );

            //save
            $sql = "UPDATE player SET tricks_taken=tricks_taken+1 WHERE player_id='$best_value_player_id'";
            $this->game->DbQuery($sql);

            // Notify
            // Note: we use 2 notifications here in order we can pause the display during the first notification
            //  before we move all cards to the winner (during the second)
            $players = $this->game->loadPlayersBasicInfos();
            $this->game->notifyAllPlayers(
                "trickWin",
                clienttranslate('${player_name} wins the trick'),
                [
                    "player_id" => $best_value_player_id,
                    "player_name" =>
                        $players[$best_value_player_id]["player_name"],
                ]
            );
            $this->game->notifyAllPlayers("giveAllCardsToPlayer", "", [
                "player_id" => $best_value_player_id,
            ]);

            if ($this->game->deck->countCardInLocation("hand") == 0) {
                // End of the hand
                return EndHand::class;
            } else {
                // End of the trick
                return NextTrick::class;
            }
        } else {
            // Standard case (not the end of the trick)
            // => just active the next player
            $player_id = $this->game->activeNextPlayer();
            $this->game->giveExtraTime($player_id);
            return PlayerTurn::class;
        }
    }
}
