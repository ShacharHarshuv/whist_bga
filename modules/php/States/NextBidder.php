<?php

declare(strict_types=1);

namespace Bga\Games\israeliwhist\States;

use Bga\GameFramework\StateType;
use Bga\Games\israeliwhist\Game;
use Bga\Games\israeliwhist\States\GiveCards;

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
        $allPasses = count(
            array_filter(
                $bids,
                fn($bid) => $bid["bid_value"] == Game::PASS ||
                    $bid["bid_value"] == Game::PASS_BLIND
            )
        );
        $this->game->dump("all_passes:", $allPasses);

        // TODO - change this to understand if we have a bidder - not suit
        $suit = $this->game->getGameStateValue("currentBidSuit");

        // Move to the next bidder - if not all players have passed
        if ($allPasses < 3 || ($allPasses === 3 && !$suit)) {
            $nextPlayerId = $this->game->activeNextPlayer();
            // Skip players who have passed (regular or blind)
            while (
                $bids[$nextPlayerId]["bid_value"] == Game::PASS ||
                $bids[$nextPlayerId]["bid_value"] == Game::PASS_BLIND
            ) {
                $nextPlayerId = $this->game->activeNextPlayer();
            }
            return PlayerBid::class;
        }

        // All players passed - Frisch
        if ($allPasses === 4) {
            $frischCounter = $this->game->getGameStateValue("frischCounter");
            if ($frischCounter >= 3) {
                // Maximum 3 card exchanges reached, start new hand
                return NewHand::class;
            }

            return GiveCards::class; // Frisch - all players pass, exchange cards
        }

        // BID WON
        $this->game->setGameStateValue("trumpSuit", $suit);
        $currentBidPlayerId = $this->game->getGameStateValue(
            "currentBidPlayerId"
        );
        $bidPlayerName = $this->game->getPlayerNameById($currentBidPlayerId);
        // Bid Won
        $this->game->notify->all(
            "bidWon",
            clienttranslate('${player_name} won the bid with ${bid_displayed}'),
            // todo: format this
            [
                "player_name" => $bidPlayerName,
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

        $this->game->gamestate->changeActivePlayer($currentBidPlayerId);
        return PlayerDeclaration::class;
    }
}
