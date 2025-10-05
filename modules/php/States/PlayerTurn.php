<?php

declare(strict_types=1);

namespace Bga\Games\IsraeliWhistShahar\States;

use Bga\GameFramework\StateType;
use Bga\Games\IsraeliWhistShahar\Game;

class PlayerTurn extends \Bga\GameFramework\States\GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game, id: 31, type: StateType::ACTIVE_PLAYER);
    }
}
