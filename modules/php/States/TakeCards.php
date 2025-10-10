<?php
declare(strict_types=1);

namespace Bga\Games\israeliwhist\States;

use Bga\GameFramework\StateType;
use Bga\Games\israeliwhist\Game;

class TakeCards extends \Bga\GameFramework\States\GameState
{
    public function __construct(protected Game $game)
    {
        parent::__construct(
            $game,
            id: 22,
            type: StateType::GAME
        );
    }

    function onEnteringState(): string
    {
        // Take cards given by the other players
        $player_list = $this->game->getObjectListFromDB(
            "SELECT player_id id FROM player", 
            true
        );

        // First pass: ensure all players have cards in temporary location
        foreach ($player_list as $player_id) {
            // Check the card pass direction and track the card giver
            $card_giver = $this->game->getPlayerToGiveCards($player_id, false);
            if (!$card_giver) {
                throw new \BgaVisibleSystemException(
                    $this->game->_("Error while determining who to give the cards")
                );
            }

            // Check cards in the "temporary" location which reserves cards to be passed
            $cards = $this->game->deck->getCardsInLocation("temporary", $player_id);
            if (!$cards) {
                // The other player didn't pass any cards, probably a zombie player
                // Randomly select 3 cards in hand and pass them
                $card_ids = $this->game->getObjectListFromDB(
                    "SELECT card_id FROM card WHERE card_location = 'hand' AND card_location_arg = $card_giver", 
                    true
                );
                shuffle($card_ids);
                $selected_card_ids = array_slice($card_ids, 0, 3);
                $this->game->deck->moveCards($selected_card_ids, "temporary", $player_id);
            }
        }

        // Second pass: move cards from temporary to hand and notify
        foreach ($player_list as $player_id) {
            // Check the card pass direction and track the card giver
            $card_giver = $this->game->getPlayerToGiveCards($player_id, false);

            // Each player takes cards in the "temporary" location and place it in their hand
            $cards = $this->game->deck->getCardsInLocation("temporary", $player_id);
            $this->game->deck->moveAllCardsInLocation("temporary", "hand", $player_id, $player_id);

            // Create received card list
            $card_list = [];
            usort($cards, [$this->game, "sortCards"]);
            foreach ($cards as $card) {
                $card_list[] = $this->game->formatCard($card['type_arg'], $card['type']);
            }

            $this->game->notify->player(
                (int)$player_id,
                "takeCards",
                clienttranslate('You received ${card_list} from ${player_name}'),
                [
                    "player_name" => $this->game->getPlayerNameById($card_giver),
                    "cards" => $cards,
                    "card_list" => implode(', ', $card_list),
                ]
            );

            // Give extra time to each player
            $this->game->giveExtraTime((int)$player_id);
        }

        return PlayerBid::class;
    }
}