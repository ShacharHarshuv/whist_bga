define([
  "dojo",
  "dojo/_base/declare",
  "ebg/core/gamegui",
  "ebg/counter",
  getLibUrl("bga-animations", "1.x"), // the lib uses bga-animations so this is required!
  getLibUrl("bga-cards", "1.x"),
], function (dojo, declare, gamegui, counter, BgaAnimations, BgaCards) {
  (window as any).BgaAnimations = BgaAnimations; // todo: do we need those "hacks"?
  (window as any).BgaCards = BgaCards;
  return declare("bgagame.israeliwhist", ebg.core.gamegui, new IsraeliWhist());
});
