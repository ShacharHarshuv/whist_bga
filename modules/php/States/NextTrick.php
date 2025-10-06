<?php

declare(strict_types=1);

namespace Bga\Games\IsraeliWhistShahar\States;

use Bga\GameFramework\StateType;
use Bga\Games\IsraeliWhistShahar\Game;
use Bga\Games\IsraeliWhistShahar\States\PlayerTurn;

class NextTrick extends \Bga\GameFramework\States\GameState
{
    public function __construct(protected Game $game)
    {
        parent::__construct($game, id: 33, type: StateType::GAME);
    }

    function onEnteringState(): string
    {
        // Reset trick color for the next trick
        $this->game->setGameStateValue("trickColor", 0);

        return PlayerTurn::class;
    }
}
