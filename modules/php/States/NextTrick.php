<?php

declare(strict_types=1);

namespace Bga\Games\israeliwhist\States;

use Bga\GameFramework\StateType;
use Bga\Games\israeliwhist\Game;

class NextTrick extends \Bga\GameFramework\States\GameState
{
    public function __construct(protected Game $game)
    {
        parent::__construct($game, id: 33, type: StateType::GAME);
    }

    function onEnteringState()
    {
        // Reset trick color for the next trick
        $this->game->setGameStateValue("trickSuit", 0);

        return PlayerTurn::class;
    }
}
