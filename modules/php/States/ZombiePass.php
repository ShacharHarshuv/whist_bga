<?php

declare(strict_types=1);

namespace Bga\Games\israeliwhist\States;

use Bga\GameFramework\StateType;
use Bga\Games\israeliwhist\Game;

class ZombiePass extends \Bga\GameFramework\States\GameState
{
    public function __construct(protected Game $game)
    {
        parent::__construct($game, id: 35, type: StateType::GAME);
    }
}
