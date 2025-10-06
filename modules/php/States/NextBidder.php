<?php

declare(strict_types=1);

namespace Bga\Games\israeliwhistshahar\States;

use Bga\GameFramework\StateType;
use Bga\Games\israeliwhistshahar\Game;

class NextBidder extends \Bga\GameFramework\States\GameState
{
    public function __construct(protected Game $game)
    {
        parent::__construct($game, id: 21, type: StateType::GAME);
    }

    function onEnteringState(): string
    {
        $passes = $this->game->getGameStateValue("numberOfPasses");
        $this->game->dump("num_passes_global:", $passes);

        $this->game->activeNextPlayer();

        if ($passes == 3) {
            $this->game->notifyAllPlayers(
                "bid_won",
                clienttranslate(
                    '${player_name} won the bid with ${value_displayed} ${color_displayed}'
                ),
                [
                    "player_name" => $this->game->getActivePlayerName(),
                    "value_displayed" => $this->game->getGameStateValue(
                        "currentBidValue"
                    ),
                    "color_displayed" => $this->game->_(
                        $this->game->suits[
                            $this->game->getGameStateValue("currentBidSuit")
                        ]["name"]
                    ),
                ]
            );
            return PlayerBet::class;
        } else {
            return PlayerBid::class;
        }
    }
}
