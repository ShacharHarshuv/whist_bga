<?php
declare(strict_types=1);

namespace Bga\Games\israeliwhist\States;

use Bga\GameFramework\StateType;
use Bga\Games\israeliwhist\Game;
use Bga\GameFramework\States\PossibleAction;
use Bga\Games\israeliwhist\States\TakeCards;

class GiveCards extends \Bga\GameFramework\States\GameState
{
    public function __construct(protected Game $game)
    {
        parent::__construct(
            $game,
            id: 24,
            type: StateType::MULTIPLE_ACTIVE_PLAYER,
            description: clienttranslate(
                "All players must choose 3 cards to give to the next player"
            ),
            descriptionMyTurn: clienttranslate(
                '${you} must choose 3 cards to give to the next player'
            )
        );
    }

    function onEnteringState(): void
    {
        // Increment the Frisch counter
        $currentCounter = $this->game->getGameStateValue("frischCounter");
        $newCounter = $currentCounter + 1;
        $this->game->setGameStateValue("frischCounter", $newCounter);

        // Notify all players that Frisch happened
        $this->game->notify->all(
            "frisch",
            clienttranslate("Frisch! All players passed - exchanging cards"),
            []
        );

        // Reset all passes (bid_value = PASS) to 0 for the next round of bidding
        $this->game->DbQuery("UPDATE player SET bid_value = 0, bid_suit = 0");

        // Make all players active for card giving
        $this->game->gamestate->setAllPlayersMultiactive();
    }

    #[PossibleAction]
    public function actGiveCards(string $card_ids, int $currentPlayerId)
    {
        // Parse card IDs
        $card_ids = rtrim($card_ids, ";");
        $card_ids_array = $card_ids ? explode(";", $card_ids) : [];
        $card_ids_array = array_unique($card_ids_array);

        if (count($card_ids_array) != 3) {
            throw new \BgaVisibleSystemException(
                "You must give exactly 3 cards"
            );
        }

        $player_to_give_cards = $this->game->getPlayerToGiveCards(
            $currentPlayerId
        );
        if (!$player_to_give_cards) {
            throw new \BgaVisibleSystemException(
                "Error while determining who to give the cards"
            );
        }

        // Check if these cards are in player's hand and record card names
        $cards = $this->game->deck->getCards($card_ids_array);
        $card_list = [];
        usort($cards, [$this->game, "sortCards"]);
        if (count($cards) != 3) {
            throw new \BgaVisibleSystemException("Invalid card Ids");
        }

        foreach ($cards as $card) {
            if (
                $card["location"] != "hand" ||
                $card["location_arg"] != $currentPlayerId
            ) {
                throw new \BgaVisibleSystemException(
                    "Some of these cards are not in your hand"
                );
            }
            $card_list[] = $this->game->formatCard(
                $card["type_arg"],
                $card["type"]
            );
        }

        // Move cards to temporary location
        $this->game->deck->moveCards(
            $card_ids_array,
            "temporary",
            $player_to_give_cards
        );

        // Notify the player
        $this->game->notify->player(
            $currentPlayerId,
            "giveCards",
            clienttranslate('You passed ${card_list} to ${player_name}'),
            [
                "player_name" => $this->game->getPlayerNameById(
                    $player_to_give_cards
                ),
                "cards" => $card_ids_array,
                "card_list" => implode(", ", $card_list),
            ]
        );

        // Make this player inactive and transition when all players are done
        $this->game->gamestate->setPlayerNonMultiactive(
            $currentPlayerId,
            TakeCards::class
        );
    }

    public function zombie(int $playerId)
    {
        // Zombie player: randomly select 3 cards
        $card_ids = $this->game->getObjectListFromDB(
            "SELECT card_id FROM card WHERE card_location = 'hand' AND card_location_arg = $playerId",
            true
        );
        shuffle($card_ids);
        $selected_card_ids = array_slice($card_ids, 0, 3);

        $this->actGiveCards(implode(";", $selected_card_ids), $playerId);
    }
}
