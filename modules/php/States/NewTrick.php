<?php

declare(strict_types=1);

namespace Bga\Games\IsraeliWhistShahar\States;

use Bga\GameFramework\StateType;
use Bga\Games\IsraeliWhistShahar\Game;
use Bga\Games\IsraeliWhistShahar\States\PlayerTurn;

class NewTrick extends \Bga\GameFramework\States\GameState
{
    public function __construct(protected Game $game)
    {
        parent::__construct($game, id: 30, type: StateType::GAME);
    }

    function onEnteringState(): string
    {
        // Reset trick color
        $this->game->setGameStateValue("trickSuit", 0);

        return PlayerTurn::class;
    }
}
