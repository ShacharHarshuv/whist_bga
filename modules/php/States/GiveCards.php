<?php
declare(strict_types=1);

namespace Bga\Games\israeliwhist\States;

use Bga\GameFramework\StateType;
use Bga\Games\israeliwhist\Game;
use Bga\GameFramework\States\PossibleAction;

class GiveCards extends \Bga\GameFramework\States\GameState
{
    public function __construct(protected Game $game)
    {
        parent::__construct(
            $game,
            id: 24,
            type: StateType::MULTIPLEACTIVEPLAYER,
            description: clienttranslate('All players must choose 3 cards to give to ${direction}'),
            descriptionMyTurn: clienttranslate('${you} must choose 3 cards to give to ${direction}')
        );
    }

    function getArgs(): array
    {
        // Send the translatable name of pass direction
        return [
            "i18n" => ['direction'],
            "direction" => $this->game->getPassDirectionName(),
        ];
    }

    function onEnteringState(): string
    {
        // Make all players active for card giving
        $this->game->gamestate->setAllPlayersMultiactive();
        
        // This state waits for all players to give cards
        // Transition happens when all players complete the action
        return TakeCards::class;
    }

    #[PossibleAction]
    public function actGiveCards(string $card_ids, int $activePlayerId)
    {
        // Parse card IDs
        $card_ids = rtrim($card_ids, ';'); // Remove trailing semicolon if present
        $card_ids_array = $card_ids ? explode(';', $card_ids) : [];
        $card_ids_array = array_unique($card_ids_array); // Remove duplicates

        if (count($card_ids_array) != 3) {
            throw new \BgaVisibleSystemException(
                $this->game->_("You must give exactly 3 cards")
            );
        }

        $player_to_give_cards = $this->game->getPlayerToGiveCards($activePlayerId, true);
        if (!$player_to_give_cards) {
            throw new \BgaVisibleSystemException(
                $this->game->_("Error while determining who to give the cards")
            );
        }

        // Check if these cards are in player's hand and record card names
        $cards = $this->game->deck->getCards($card_ids_array);
        $card_list = [];
        usort($cards, [$this->game, "sortCards"]);
        
        if (count($cards) != 3) {
            throw new \BgaVisibleSystemException(
                $this->game->_("Some of these cards don't exist")
            );
        }

        foreach ($cards as $card) {
            if ($card['location'] != 'hand' || $card['location_arg'] != $activePlayerId) {
                throw new \BgaVisibleSystemException(
                    $this->game->_("Some of these cards are not in your hand")
                );
            }
            $card_list[] = $this->game->suits[$card['type']]['name'] . 
                          $this->game->values_label[$card['type_arg']];
        }

        // Move cards to temporary location
        $this->game->deck->moveCards($card_ids_array, "temporary", $player_to_give_cards);

        // Notify the player
        $this->game->notify->player(
            $activePlayerId,
            "giveCards",
            clienttranslate('You passed ${card_list} to ${player_name}'),
            [
                'player_name' => $this->game->getPlayerNameById($player_to_give_cards),
                'cards' => $card_ids_array,
                'card_list' => implode(', ', $card_list),
            ]
        );

        // Make this player inactive
        $this->game->gamestate->setPlayerNonMultiactive($activePlayerId, '');
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
        
        $this->actGiveCards(implode(';', $selected_card_ids), $playerId);
    }
}