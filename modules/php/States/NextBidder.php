<?php

declare(strict_types=1);

namespace Bga\Games\israeliwhist\States;

use Bga\GameFramework\StateType;
use Bga\Games\israeliwhist\Game;

class NextBidder extends \Bga\GameFramework\States\GameState
{
    public function __construct(protected Game $game)
    {
        parent::__construct($game, id: 21, type: StateType::GAME);
    }

    function onEnteringState(): string
    {
        $bids = $this->game->getCollectionFromDb(
            "SELECT player_id, bid_value, bid_suit FROM player"
        );
        $passes = count(
            array_filter($bids, fn($bid) => $bid["bid_value"] == -2)
        );
        $this->game->dump("num_passes_from_db:", $passes);

        $suit = $this->game->getGameStateValue("currentBidSuit");

        if ($passes < 3 || ($passes === 3 && !$suit)) {
            $nextPlayerId = $this->game->activeNextPlayer();
            while ($bids[$nextPlayerId]["bid_value"] == -2) {
                $nextPlayerId = $this->game->activeNextPlayer();
            }
            return PlayerBid::class;
        }

        if ($passes === 4) {
            return NewHand::class; // TODO: implement Frisch
        }

        $this->game->setGameStateValue("trumpSuit", $suit);
        // Bid Won
        $this->game->notify->all(
            "bidWon",
            clienttranslate('${player_name} won the bid with ${bid_displayed}'),
            // todo: format this
            [
                "player_name" => $this->game->getActivePlayerName(),
                "value_displayed" => $this->game->getGameStateValue(
                    "currentBidValue"
                ),
                "bid_displayed" => $this->game->formatBid(
                    (int) $this->game->getGameStateValue("currentBidValue"),
                    (int) $this->game->getGameStateValue("currentBidSuit")
                ),
                "suit" => $suit,
            ]
        );

        $this->game->gamestate->changeActivePlayer(
            $this->game->getGameStateValue("currentBidPlayerId")
        );
        return PlayerDeclaration::class;
    }
}
