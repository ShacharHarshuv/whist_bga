<?php

declare(strict_types=1);

namespace Bga\Games\israeliwhist\States;

use Bga\GameFramework\StateType;
use Bga\Games\israeliwhist\Game;
use Bga\GameFramework\States\PossibleAction;

class PlayerTurn extends \Bga\GameFramework\States\GameState
{
    public function __construct(protected Game $game)
    {
        parent::__construct(
            $game,
            id: 31,
            type: StateType::ACTIVE_PLAYER,
            description: clienttranslate('${actplayer} must play a card'),
            descriptionMyTurn: clienttranslate('${you} must play a card')
        );
    }

    public function onEnteringState()
    {
        $activePlayerId = (int) $this->game->getActivePlayerId();
        $hand = $this->game->deck->getPlayerHand($activePlayerId);

        if (count($hand) === 1) {
            $card = reset($hand);
            return $this->actPlayCard((int) $card["id"], $activePlayerId);
        }
    }

    private function checkIsCardPlayable(int $cardId, int $playerId)
    {
        $game = $this->game;

        // Check if player already played a card this trick
        if ($game->deck->getCardsInLocation("cardsontable", $playerId)) {
            return throw new \BgaVisibleSystemException(
                clienttranslate("You already played a card in this trick")
            );
        }

        // Check if card exists in player's hand
        $card = $game->deck->getCard($cardId);
        if (
            $card["location"] !== "hand" ||
            $card["location_arg"] != $playerId
        ) {
            return throw new \BgaVisibleSystemException(
                clienttranslate("You don't have that card in your hand")
            );
        }

        $currentTrickSuit = $game->getGameStateValue("trickSuit");

        // If this is the first card of the trick, any card is playable
        if (!$currentTrickSuit) {
            return;
        }

        // If card follows the trick suit, it's playable
        if ($card["type"] == $currentTrickSuit) {
            return;
        }

        // If card doesn't follow suit, check if player has any cards of the trick suit
        $hand = $game->deck->getPlayerHand($playerId);
        foreach ($hand as $handCard) {
            if ($handCard["type"] == $currentTrickSuit) {
                return throw new \BgaVisibleSystemException(
                    clienttranslate("You have to play a card of the same suit")
                );
            }
        }

        // Player has no cards of the trick suit, so any card is playable
        return true;
    }

    #[PossibleAction]
    public function actPlayCard(int $cardId, int $activePlayerId)
    {
        $game = $this->game;

        $this->checkIsCardPlayable($cardId, $activePlayerId);

        $game->deck->moveCard($cardId, "cardsontable", $activePlayerId);
        $currentCard = $game->deck->getCard($cardId);

        $currenttrickSuit = $game->getGameStateValue("trickSuit");
        if ($currenttrickSuit == 0) {
            $game->setGameStateValue("trickSuit", $currentCard["type"]);
        }

        // And notify
        $this->notify->all(
            "playCard",
            clienttranslate(
                '${player_name} plays ${value_displayed} ${color_displayed}'
            ),
            [
                "i18n" => ["color_displayed", "value_displayed"],
                "card_id" => $cardId,
                "player_id" => $activePlayerId,
                "player_name" => $game->getActivePlayerName(),
                "value" => $currentCard["type_arg"],
                "value_displayed" =>
                    $game->values_label[$currentCard["type_arg"]],
                "color" => $currentCard["type"],
                "color_displayed" => clienttranslate(
                    $game->suits[$currentCard["type"]]["name"]
                ),
            ]
        );
        return NextPlayer::class;
    }

    // Plays the highest possible card
    public function zombie(int $playerId)
    {
        $game = $this->game;

        // Get all cards in player's hand
        $hand = $game->deck->getPlayerHand($playerId);

        $currentTrickSuit = $game->getGameStateValue("trickSuit");

        $cardToPlay = null;
        $highestValue = 0;

        if ($currentTrickSuit) {
            foreach ($hand as $card) {
                if (
                    $card["type"] == $currentTrickSuit &&
                    $card["type_arg"] > $highestValue
                ) {
                    $highestValue = $card["type_arg"];
                    $cardToPlay = $card;
                }
            }
        }

        if (!$cardToPlay) {
            foreach ($hand as $card) {
                if ($card["type_arg"] > $highestValue) {
                    $highestValue = $card["type_arg"];
                    $cardToPlay = $card;
                }
            }
        }

        if ($cardToPlay) {
            $this->actPlayCard($cardToPlay["id"], $playerId);
        }
    }
}
