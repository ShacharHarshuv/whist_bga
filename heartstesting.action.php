<?php
/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * HeartsTesting implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on https://boardgamearena.com.
 * See http://en.doc.boardgamearena.com/Studio for more information.
 * -----
 *
 * heartstesting.action.php
 *
 * HeartsTesting main action entry point
 *
 *
 * In this file, you are describing all the methods that can be called from your
 * user interface logic (javascript).
 *
 * If you define a method "myAction" here, then you can call it from your javascript code with:
 * this.ajaxcall( "/heartstesting/heartstesting/myAction.html", ...)
 *
 */


  class action_heartstesting extends APP_GameAction
  {
    // Constructor: please do not modify
   	public function __default()
  	{
  	    if( self::isArg( 'notifwindow') )
  	    {
            $this->view = "common_notifwindow";
  	        $this->viewArgs['table'] = self::getArg( "table", AT_posint, true );
  	    }
  	    else
  	    {
            $this->view = "heartstesting_heartstesting";
            self::trace( "Complete reinitialization of board game" );
      }
  	}

  	// TODO: defines your action entry points there

    public function pass() {
      self::setAjaxMode();
      $this->game->pass();
      self::ajaxResponse();
    }

    public function playCard() {
      self::setAjaxMode();
      $card_id = self::getArg("id", AT_posint, true);
      $this->game->playCard($card_id);
      self::ajaxResponse();
    }

    public function bid() {
        self::setAjaxMode();
        $bidValue = self::getArg("bid_value", AT_posint, true);
        $shape = self::getArg("shape", AT_posint, true);

        $this->game->playerBid($bidValue, $shape);
        self::ajaxResponse();
    }

    public function bet() {
        self::setAjaxMode();
        $bidValue = self::getArg("bid_value", AT_posint, true);

        $this->game->playerBet($bidValue);
        self::ajaxResponse();
    }


    /*

    Example:

    public function myAction()
    {
        self::setAjaxMode();

        // Retrieve arguments
        // Note: these arguments correspond to what has been sent through the javascript "ajaxcall" method
        $arg1 = self::getArg( "myArgument1", AT_posint, true );
        $arg2 = self::getArg( "myArgument2", AT_posint, true );

        // Then, call the appropriate method in your game logic, like "playCard" or "myAction"
        $this->game->myAction( $arg1, $arg2 );

        self::ajaxResponse( );
    }

    */

  }
