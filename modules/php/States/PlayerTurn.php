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

    #[PossibleAction]
    public function actPlayCard(int $cardId, int $activePlayerId)
    {
        $game = $this->game;

        // Check whether the selected card can be played or not
        $playable_cards = $game->checkPlayableCards($activePlayerId);
        if (!in_array($cardId, $playable_cards)) {
            throw new \BgaVisibleSystemException(
                clienttranslate("You must play a card with the same suit")
            );
        }

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
}
