/**
 * Global settings to apply as a default to all animations. Can be overriden in each animation.
 */
interface AnimationManagerSettings {
  /**
   * The default animation duration, in ms (default: 500).
   */
  duration?: number;

  /**
   * The CSS easing function, default 'ease-in-out'.
   */
  easing?: string;

  /**
   * Determines the behavior of the placeholder at the starting position ("from") of the animation.
   * Default: 'shrinking'.
   *
   * Options:
   * - 'on': Keeps the placeholder occupying the full element's space until the animation completes.
   * - 'off': Does not add a placeholder.
   * - 'shrink': Gradually reduces the placeholder's size until it disappears.
   */
  fromPlaceholder?: "on" | "shrink" | "off";

  /**
   * Determines the behavior of the placeholder at the ending position ("to") of the animation.
   * Default: 'growing'.
   *
   * Options:
   * - 'on': Keeps the placeholder occupying the full element's space until the animation completes.
   * - 'off': Does not add a placeholder.
   * - 'grow': Gradually increases the placeholder's size until it fully appears.
   */
  toPlaceholder?: "on" | "grow" | "off";

  /**
   * A function returning a boolean, or a boolean, to know if animations are active.
   */
  animationsActive?: (() => boolean) | boolean;
}

/**
 * Extra animation to apply to another element while main animation is played. Will have the same duration.
 */
interface ParallelAnimation {
  /**
   * Element to apply the animation to. If not set, will use `applyTo`.
   */
  applyToElement?: HTMLElement;

  /**
   * Element to apply the animation to, if `applyToElement` is not set. Default to 'intermediate'.
   * 'wrapper': will apply the animation directly on the wrapper.
   * 'intermediate': will apply the animation on a new wrapper inserted between the main wrapper and the element.
   * 'element': will apply the animation directly on the animated element.
   */
  applyTo?: "wrapper" | "intermediate" | "element";

  /**
   * Keyframes of the animation.
   */
  keyframes: Keyframe[];
}

/**
 * Settings to apply to an animation. Other animations can be run in parallel, using the same duration.
 */
interface AnimationSettings extends AnimationManagerSettings {
  /**
   * Animations to play at the same time as the main animation
   */
  parallelAnimations?: ParallelAnimation[];

  /**
   * Preserve the scale of the object when sliding in or out.
   */
  preserveScale?: boolean;
}

interface SlideAnimationSettings extends AnimationSettings {
  /**
   * The scale bump to use in the middle of a slide animation, to fake an item grabbed from one place to the other. Default 1.2
   */
  bump?: number;
}

type SortFunction<T> = (a: T, b: T) => number;
declare function sort<T>(...sortedFields: string[]): SortFunction<T>;

type SideOrAngle =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "top"
  | "bottom"
  | "left"
  | "right";
type SideOrAngleOrCenter = SideOrAngle | "center";
interface CardCounterSettings {
  /**
   * Show a card counter on the deck. Default true.
   */
  show?: boolean;
  /**
   * Counter position. Default 'bottom'.
   */
  position?: SideOrAngleOrCenter;
  /**
   * Classes to add to counter (separated with spaces). Pre-built are `round` and `text-shadow`. Default `round`.
   */
  extraClasses?: string;
  /**
   * Show the counter when empty. Default true.
   */
  hideWhenEmpty?: boolean;
  /**
   * Set a counter id if you want to set a tooltip on it, for example. Default unset.
   */
  counterId?: string;
  /**
   * Define the size of the counter, as a percentage of the dimensions of the card. Default 10.
   */
  size?: number;
}
/**
 * A card counter for card stocks, visible if the card stock defines the counter property.
 */
declare class CardCounter<T> {
  protected manager: CardManager<T>;
  protected element: HTMLElement;
  protected settings?: CardCounterSettings;
  protected counterDiv: HTMLDivElement | null;
  constructor(
    manager: CardManager<T>,
    element: HTMLElement,
    settings?: CardCounterSettings,
  );
  protected createCounter(
    counterPosition: SideOrAngleOrCenter,
    extraClasses: string,
    size?: number,
    hideWhenEmpty?: boolean,
    counterId?: string,
  ): void;
  setCardCount(cardCount: number): void;
}

interface SelectionStyle {
  /**
   * The class to apply to this selection style. Use class from manager is unset in the card stock.
   */
  class?: string | null;
  /**
   * The outline size. Default 5px;
   */
  outlineSize?: number;
  /**
   * The outline color. Default 'orange' for selectable dashes, 'blueviolet' for selected line.
   */
  outlineColor?: string;
}
interface CardStockSettings<T> {
  /**
   * Indicate the card sorting (unset means no sorting, new cards will be added at the end).
   * For example, use `sort: sortFunction('type', '-type_arg')` to sort by type then type_arg (in reversed order if prefixed with `-`).
   * Be sure you typed the values correctly! Else '11' will be before '2'.
   */
  sort?: SortFunction<T>;
  /**
   * The filter on card click event. Use setting from manager is unset.
   */
  cardClickEventFilter?: CardClickEventFilter;
  /**
   * The style to apply to selectable cards. Use style from manager is unset.
   */
  selectableCardStyle?: SelectionStyle;
  /**
   * The style to apply to selectable cards. Use style from manager is unset.
   */
  unselectableCardStyle?: SelectionStyle;
  /**
   * The style to apply to selected cards. Use style from manager is unset.
   */
  selectedCardStyle?: SelectionStyle;
  /**
   * The style to apply to the last played card. Default to class 'bga-cards_last-played-card'.
   */
  lastPlayedCardStyle?: SelectionStyle;
  /**
   * Show a card counter on the stock. Not visible if unset.
   */
  counter?: CardCounterSettings;
  /**
   * Say if a given card should be placed on this stock, based on card properties.
   * For example, every card with location === 'hand' and location_arg == this.player_id should go to the current player hand.
   * If unset, all cards on this stock must be added manually on this stock.
   *
   * @param card the card to place on a stock
   * @returns true if the card should be placed on this stock.
   */
  autoPlace?: (card: T) => boolean;
}
interface AddCardSettings extends SlideAnimationSettings {
  /**
   * The stock to take the card. It will automatically remove the card from the other stock.
   */
  fromStock?: CardStock<any>;
  /**
   * The element to move the card from.
   */
  fromElement?: HTMLElement;
  /**
   * Card side at the beginning of the animation. Default 'auto' to isCardVisible. Ignored if the card already exists.
   */
  initialSide?: "auto" | "front" | "back";
  /**
   * Card side at the end of the animation. Default to initialSide.
   */
  finalSide?: "auto" | "front" | "back";
  forceToElement?: HTMLElement;
  /**
   * Force card position. Default to end of list. Do not use if sort is defined, as it will override it.
   */
  index?: number;
  /**
   * Set if the card is selectable. Default is true, but will be ignored if the stock is not selectable.
   */
  selectable?: boolean;
  /**
   * Indicates if we add a fade in effect when adding card (if it comes from an invisible or abstract element).
   */
  fadeIn?: boolean;
  /**
   * For counters.
   * Indicate if the card count is automatically updated when a card is added or removed. Default true.
   */
  autoUpdateCardNumber?: boolean;
}
interface RemoveCardSettings {
  slideTo?: HTMLElement;
  fadeOut?: boolean;
  /**
   * For counters.
   * Indicate if the card count is automatically updated when a card is added or removed. Default true.
   */
  autoUpdateCardNumber?: boolean;
}
type CardSelectionMode = "none" | "single" | "multiple";
/**
 * The abstract stock. It shouldn't be used directly, use stocks that extends it.
 */
declare class CardStock<T> {
  protected manager: CardManager<T>;
  protected element: HTMLElement;
  protected settings?: CardStockSettings<T>;
  protected cards: T[];
  protected selectableCards: T[];
  protected selectedCards: T[];
  protected selectionMode: CardSelectionMode;
  protected sort?: SortFunction<T>;
  protected counter: CardCounter<T> | null;
  /**
   * Called when selection change. Returns the selection.
   *
   * selection: the selected cards of the stock
   * lastChange: the last change on selection card (can be selected or unselected)
   */
  onSelectionChange?: (selection: T[], lastChange: T | null) => void;
  /**
   * Called when a card is clicked. Returns the clicked card.
   *
   * card: the clicked card (can be selected or unselected)
   */
  onCardClick?: (card: T) => void;
  /**
   * Called when card count change. Returns the clicked card.
   *
   * card: the clicked card (can be selected or unselected)
   */
  onCardCountChange?: (cardCount: number) => void;
  /**
   * Called when a card is added to the stock. Returns the added card.
   *
   * card: the added card
   */
  onCardAdded?: (card: T) => void;
  /**
   * Called when a card is removed from the stock. Returns the removed card.
   *
   * card: the removed card
   */
  onCardRemoved?: (card: T) => void;
  /**
   * Creates the stock and register it on the manager.
   *
   * @param manager the card manager
   * @param element the stock element (should be an empty HTML Element)
   */
  constructor(
    manager: CardManager<T>,
    element: HTMLElement,
    settings?: CardStockSettings<T>,
  );
  protected setSelectionStyleOverrides(
    element: HTMLElement,
    settings?: CardStockSettings<T>,
  ): void;
  /**
   * Removes the stock and unregister it on the manager.
   */
  remove(): void;
  /**
   * @returns the cards on the stock
   */
  getCards(): T[];
  /**
   * @returns if the stock is empty
   */
  isEmpty(): boolean;
  /**
   * @returns the selected cards
   */
  getSelection(): T[];
  /**
   * @returns if the card is selectable
   */
  isSelectable(card: T): boolean;
  /**
   * @returns if the card is selected
   */
  isSelected(card: T): boolean;
  /**
   * @param card a card
   * @returns if the card is present in the stock
   */
  contains(card: T): boolean;
  /**
   * @param card a card in the stock
   * @returns the HTML element generated for the card
   */
  getCardElement(card: T): HTMLElement;
  /**
   * Checks if the card can be added. By default, only if it isn't already present in the stock.
   *
   * @param card the card to add
   * @param settings the addCard settings
   * @returns if the card can be added
   */
  protected canAddCard(card: T, settings?: AddCardSettings): boolean;
  /**
   * Add a card to the stock.
   *
   * @param card the card to add
   * @param settings a `AddCardSettings` object
   * @returns the promise when the animation is done (true if it was animated, false if it wasn't)
   */
  addCard(card: T, settings?: AddCardSettings): Promise<boolean>;
  protected addExistingCardElement(
    card: T,
    cardElement: HTMLElement,
    settings?: AddCardSettings,
  ): Promise<boolean>;
  protected addUnexistingCardElement(
    card: T,
    settings?: AddCardSettings,
  ): Promise<boolean>;
  protected getNewCardIndex(card: T): number | undefined;
  protected addCardElementToParent(
    cardElement: HTMLElement,
    settings?: AddCardSettings,
  ): void;
  /**
   * Add an array of cards to the stock.
   *
   * @param cards the cards to add
   * @param settings a `AddCardSettings` object
   * @param shift if number, the number of milliseconds between each card. if true, chain animations
   */
  addCards(
    cards: T[],
    settings?: AddCardSettings,
    shift?: number | boolean,
  ): Promise<boolean>;
  /**
   * Remove a card from the stock.
   *
   * @param card the card to remove
   * @param settings a `RemoveCardSettings` object
   */
  removeCard(card: T, settings?: RemoveCardSettings): Promise<boolean>;
  /**
   * Notify the stock that a card is removed.
   *
   * @param card the card to remove
   * @param settings a `RemoveCardSettings` object
   */
  cardRemoved(card: T, settings?: RemoveCardSettings): void;
  /**
   * Remove a set of card from the stock.
   *
   * @param cards the cards to remove
   * @param settings a `RemoveCardSettings` object
   */
  removeCards(cards: T[], settings?: RemoveCardSettings): Promise<boolean>;
  /**
   * Remove all cards from the stock.
   * @param settings a `RemoveCardSettings` object
   */
  removeAll(settings?: RemoveCardSettings): Promise<boolean>;
  getSelectionMode(): CardSelectionMode;
  /**
   * Set if the stock is selectable, and if yes if it can be multiple.
   * If set to 'none', it will unselect all selected cards.
   *
   * @param selectionMode the selection mode
   * @param selectableCards the selectable cards (all if unset). Calls `setSelectableCards` method
   */
  setSelectionMode(
    selectionMode: CardSelectionMode,
    selectableCards?: T[],
  ): void;
  protected setSelectableCard(card: T, selectable: boolean): void;
  /**
   * Set the selectable class for each card.
   *
   * @param selectableCards the selectable cards. If unset, all cards are marked selectable. Default unset.
   */
  setSelectableCards(selectableCards?: T[]): void;
  /**
   * Set selected state to a card.
   *
   * @param card the card to select
   */
  selectCard(card: T, silent?: boolean): void;
  /**
   * Set unselected state to a card.
   *
   * @param card the card to unselect
   */
  unselectCard(card: T, silent?: boolean): void;
  /**
   * Select all cards
   */
  selectAll(silent?: boolean): void;
  /**
   * Unselect all cards
   */
  unselectAll(silent?: boolean): void;
  protected bindClick(): void;
  protected cardClick(card: T): void;
  /**
   * @param element The element to animate. The element is added to the destination stock before the animation starts.
   * @param toElement The HTMLElement to attach the card to.
   */
  protected animationFromElement(
    card: T,
    element: HTMLElement,
    fromElement: HTMLElement | null | undefined,
    toElement: HTMLElement,
    insertBefore: HTMLElement | null | undefined,
    settings: AddCardSettings,
  ): Promise<boolean>;
  /**
   * Set the card to its front (visible) or back (not visible) side.
   *
   * @param card the card informations
   */
  setCardVisible(card: T, visible: boolean, settings?: FlipCardSettings): void;
  /**
   * Flips the card.
   *
   * @param card the card informations
   */
  flipCard(card: T, settings?: FlipCardSettings): void;
  /**
   * @returns the filtering to apply on card click events. Use setting from manager if unset.
   */
  getCardClickEventFilter(): CardClickEventFilter;
  /**
   * @returns the style to apply to selectable cards. Use style from manager if unset.
   */
  getSelectableCardStyle(): SelectionStyle;
  /**
   * @returns the style to apply to selectable cards. Use style from manager if unset.
   */
  getUnselectableCardStyle(): SelectionStyle;
  /**
   * @returns the style to apply to selected cards. Use style from manager if unset.
   */
  getSelectedCardStyle(): SelectionStyle;
  /**
   * @returns the style to apply to last play cards. Use style from manager if unset.
   */
  getLastPlayedCardStyle(): SelectionStyle;
  removeSelectionClasses(card: T): void;
  removeSelectionClassesFromElement(cardElement: HTMLElement): void;
  /**
   * Changes the sort function of the stock.
   *
   * @param sort the new sort function. If defined, the stock will be sorted with this new function.
   */
  setSort(sort?: SortFunction<T>): void;
  /**
   * Triggered after card order is changed, when setting a new sort function.
   */
  protected cardOrderChanged(): void;
  /**
   * Returns the card count in the deck (what the player think there is, for decks, the real number of cards for all visible card stocks).
   *
   * @returns the number of card in the stock
   */
  getCardCount(): number;
  /**
   * Updates the cards number, if the counter is visible.
   */
  protected cardNumberUpdated(): void;
  /**
   * Returns if a card should be placed on this stock (with the autoPlace setting).
   */
  shouldPlaceCard(card: T): boolean;
  /**
   * Remove the mark of the last play cards.
   */
  removeLastPlayedCardsClass(cardClass?: string): void;
  /**
   * Mark the last play cards. Remove the other last play card classes.
   *
   * @param cards the cards to mark as last played
   * @param color the color to use to mark the last played card, usually the player color
   * @param cardClass a class applied on this type of cards, to limit removal to these type of cards.
   */
  setLastPlayedCards(
    cards: T[] | null,
    color?: string,
    cardClass?: string,
  ): void;
}

type AnimationManager = any;
/**
 * selectable: only send card click event when the card is selectable.
 * stock-selectable: only send card click event when the stock is selectable (but the card might be disabled).
 * all: send card click events even if the stock is not selectable.
 */
type CardClickEventFilter = "selectable" | "stock-selectable" | "all";

interface AutoPlaceSettings<T> {
  /**
   * The add cards settings, for example if you want to set an animation from an invisible point (can be the player mini panel)
   * Will only be called if the card match a stock with the "autoPlace" setting.
   *
   * @param card the card to add
   * @returns the settings to add the card. `{ fromElement: originElement }` will add a slide in animation
   */
  addSettings?: (card: T) => AddCardSettings | undefined;
  /**
   * The remove settings, when a card does not match any stock with the "autoPlace" setting.
   *
   * @param card the card to remove
   * @returns the settings to remove the card. `{}` will simply remove the card from it's current stock without any error. `{ slideTo: destinationElement }` will add an animation before removing the card.
   */
  removeSettings?: (card: T) => RemoveCardSettings | undefined;
}
interface CardManagerSettings<T> {
  /**
   * The type of cards, if you game has multiple cards types (each card manager should have a different type).
   * Default `${yourgamename}-card`.
   *
   * The card element will have this type as a class, and each side will have the class `${type}-${'front'/'back'}`.
   */
  type?: string;
  /**
   * Define the id that will be set to each card div. It must return a unique id for each different card, so it's often linked to card id.
   *
   * Default: the id will be set to `card.id`.
   *
   * @param card the card informations
   * @return the id for a card
   */
  getId?: (card: T) => string | number;
  /**
   * Allow to populate the main div of the card. You can set classes or dataset, if it's informations shared by both sides.
   *
   * @param card the card informations
   * @param element the card main Div element. You can add a class (to set width/height), change dataset, ... based on the card informations. There should be no visual informations on it, as it will be set on front/back Divs.
   * @return the id for a card
   */
  setupDiv?: (card: T, element: HTMLDivElement) => void;
  /**
   * Allow to populate the front div of the card. You can set classes or dataset to show the correct card face.
   * You can also add some translated text on the card at this moment.
   *
   * @param card the card informations
   * @param element the card front Div element. You can add a class, change dataset, set background for the back side
   * @return the id for a card
   */
  setupFrontDiv?: (card: T, element: HTMLDivElement) => void;
  /**
   * Allow to populate the back div of the card. You can set classes or dataset to show the correct card face.
   * You can also add some translated text on the card at this moment.
   *
   * @param card the card informations
   * @param element  the card back Div element. You can add a class, change dataset, set background for the back side
   * @return the id for a card
   */
  setupBackDiv?: (card: T, element: HTMLDivElement) => void;
  /**
   * A function to determine if the card should show front side or back side, based on the informations of the card object.
   * If you only manage visible cards, set it to `() => true`.
   * Default is `card.type` is truthy.
   *
   * @param card the card informations
   * @return true if front side should be visible
   */
  isCardVisible?: (card: T) => boolean;
  /**
   * Return the card rotation.
   * Use `getCardRotation` from settings if set, else will return 0
   *
   * @param card the card informations
   * @return the card rotation
   */
  getCardRotation?: (card: T) => number;
  /**
   * A generator of fake cards, to generate decks top card automatically.
   * Default is generating an empty card, with only id set.
   *
   * @param deckId the deck id
   * @return the fake card to be generated (usually, only informations to show back side)
   */
  fakeCardGenerator?: (deckId: string) => T;
  /**
   * The animation manager used in the game.
   */
  animationManager: AnimationManager;
  /**
   * Indicate the width of a card (in px).
   */
  cardWidth?: number;
  /**
   * Indicate the height of a card (in px).
   */
  cardHeight?: number;
  /**
   * Indicate the width of a card border radius (example : '10px', '50%').
   */
  cardBorderRadius?: string;
  /**
   * The filter on card click event. Default 'selectable'.
   */
  cardClickEventFilter?: CardClickEventFilter;
  /**
   * The style to apply to selectable cards. Default to class 'bga-cards_selectable-card'.
   */
  selectableCardStyle?: SelectionStyle;
  /**
   * The style to apply to selectable cards. Use style from manager is unset. Default to class 'bga-cards_unselectable-card'.
   */
  unselectableCardStyle?: SelectionStyle;
  /**
   * The style to apply to selected cards. Use style from manager is unset. Default to class 'bga-cards_selected-card'.
   */
  selectedCardStyle?: SelectionStyle;
  /**
   * The style to apply to selectable slots. Default to class 'bga-cards_selectable-slot'.
   */
  selectableSlotStyle?: SelectionStyle;
  /**
   * The style to apply to selectable slots. Default to class 'bga-cards_unselectable-slot'.
   */
  unselectableSlotStyle?: SelectionStyle;
  /**
   * The style to apply to selected slots. Default to class 'bga-cards_selected-slot'.
   */
  selectedSlotStyle?: SelectionStyle;
  /**
   * The style to apply to the last played card. Default to class 'bga-cards_last-played-card'.
   */
  lastPlayedCardStyle?: SelectionStyle;
  /**
   * The settings when using placeCard(s) to automatically place some cards in the matching stock
   */
  autoPlace?: AutoPlaceSettings<T>;
}
interface FlipCardSettings {
  /**
   * Updates the data of the flipped card, so the stock containing it will return the new data when using getCards().
   * The new data is the card passed as the first argument of the `setCardVisible` / `flipCard` method.
   * Default true
   */
  updateData?: boolean;
  /**
   * Updates the main div display, by calling `setupDiv`.
   * Default true
   */
  updateMain?: boolean;
  /**
   * Updates the front display, by calling `setupFrontDiv`.
   * The new data is the card passed as the first argument of the `setCardVisible` / `flipCard` method.
   * Default true
   */
  updateFront?: boolean;
  /**
   * Updates the back display, by calling `setupBackDiv`.
   * The new data is the card passed as the first argument of the `setCardVisible` / `flipCard` method.
   * Default false
   */
  updateBack?: boolean;
  /**
   * Delay before updateMain (in ms).
   * Allow the card main div setting to be visible during the flip animation.
   * Default 0.
   */
  updateMainDelay?: number;
  /**
   * Delay before updateFront (in ms).
   * Allow the card front to be visible during the flip animation.
   * Default 500
   */
  updateFrontDelay?: number;
  /**
   * Delay before updateBackDelay (in ms).
   * Allow the card back to be visible during the flip animation.
   * Default 0
   */
  updateBackDelay?: number;
}
declare class CardManager<T> {
  private settings;
  animationManager: AnimationManager;
  private stocks;
  private updateMainTimeoutId;
  private updateFrontTimeoutId;
  private updateBackTimeoutId;
  /**
   * @param settings a `CardManagerSettings` object
   */
  constructor(settings: CardManagerSettings<T>);
  addStock(stock: CardStock<T>): void;
  removeStock(stock: CardStock<T>): void;
  /**
   * @param card the card informations
   * @return the id for a card
   */
  getId(card: T): string | number;
  /**
   * @param card the card informations
   * @return the id for a card element
   */
  getCardElementId(card: T): string;
  /**
   *
   * @returns the type of the cards, either set in the settings or by using a default one if there is only 1 type.
   */
  getType(): string;
  createCardElement(
    card: T,
    initialSide?: "auto" | "front" | "back",
  ): HTMLDivElement;
  /**
   * @param card the card informations
   * @return the HTML element of an existing card
   */
  getCardElement(card: T): HTMLElement;
  /**
   *
   * @param card the card informations
   * @returns the HTML element of the faces of the card
   */
  getCardSideElements(card: T): HTMLElement[];
  /**
   *
   * @param element the HTML element of the card
   * @returns the HTML element of the faces of the card
   */
  getCardSideElementsFromCardElement(
    element: HTMLElement,
  ): HTMLElement[] | undefined;
  /**
   * Remove a card.
   *
   * @param card the card to remove
   * @param settings a `RemoveCardSettings` object
   */
  removeCard(card: T, settings?: RemoveCardSettings): Promise<boolean>;
  /**
   * Returns the stock containing the card.
   *
   * @param card the card informations
   * @return the stock containing the card
   */
  getCardStock(card: T): CardStock<T>;
  /**
   * Return if the card passed as parameter is suppose to be visible or not.
   * Use `isCardVisible` from settings if set, else will check if `card.type` is defined
   *
   * @param card the card informations
   * @return the visiblility of the card (true means front side should be displayed)
   */
  isCardVisible(card: T): boolean;
  /**
   * Return the card rotation.
   * Use `getCardRotation` from settings if set, else will return 0
   *
   * @param card the card informations
   * @return the card rotation
   */
  getCardRotation(card: T): number;
  /**
   * Set the card to its front (visible) or back (not visible) side.
   *
   * @param card the card informations
   * @param visible if the card is set to visible face. If unset, will use isCardVisible(card)
   * @param settings the flip params (to update the card in current stock)
   */
  setCardVisible(card: T, visible?: boolean, settings?: FlipCardSettings): void;
  /**
   * Flips the card.
   *
   * @param card the card informations
   * @param settings the flip params (to update the card in current stock)
   */
  flipCard(card: T, settings?: FlipCardSettings): void;
  /**
   * Update the card informations. Used when a card with just an id (back shown) should be revealed, with all data needed to populate the front.
   *
   * @param card the card informations
   */
  updateCardInformations(
    card: T,
    settings?: Omit<FlipCardSettings, "updateData">,
  ): void;
  /**
   * @returns the card with set in the settings (undefined if unset)
   */
  getCardWidth(): number | undefined;
  /**
   * @returns the card height set in the settings (undefined if unset)
   */
  getCardHeight(): number | undefined;
  /**
   * @returns the card height set in the settings (undefined if unset)
   */
  getCardBorderRadius(): string | undefined;
  /**
   * @returns the filtering to apply on card click events. Default 'selectable'.
   */
  getCardClickEventFilter(): CardClickEventFilter;
  /**
   * @returns the style to apply to selectable cards. Default to class 'bga-cards_selectable-card'.
   */
  getSelectableCardStyle(): SelectionStyle;
  /**
   * @returns the style to apply to unselectable cards. Default to class 'bga-cards_unselectable-card'.
   */
  getUnselectableCardStyle(): SelectionStyle;
  /**
   * @returns the style to apply to selected cards. Default to class 'bga-cards_selected-card'.
   */
  getSelectedCardStyle(): SelectionStyle;
  /**
   * @returns the style to apply to selectable slots. Default to class 'bga-cards_selectable-slot'.
   */
  getSelectableSlotStyle(): SelectionStyle;
  /**
   * @returns the style to apply to unselectable slots. Default to class 'bga-cards_unselectable-slot'.
   */
  getUnselectableSlotStyle(): SelectionStyle;
  /**
   * @returns the style to apply to selected slots. Default to class 'bga-cards_selected-slot'.
   */
  getSelectedSlotStyle(): SelectionStyle;
  /**
   * @returns the style to apply to the last played card. Default to class 'bga-cards_last-played-card'.
   */
  getLastPlayedCardStyle(): SelectionStyle;
  getFakeCardGenerator(): (deckId: string) => T;
  /**
   * Mark the last play card. Remove the other last play card classes.
   *
   * @param card the card to mark as last played
   * @param color the color to use to mark the last played card, usually the player color
   * @param cardClass a class applied on this type of cards, to limit removal to these type of cards.
   */
  setLastPlayedCard(card: T | null, color?: string, cardClass?: string): void;
  /**
   * Mark the last play cards. Remove the other last play card classes.
   *
   * @param cards the cards to mark as last played
   * @param color the color to use to mark the last played card, usually the player color
   * @param cardClass a class applied on this type of cards, to limit removal to these type of cards.
   */
  setLastPlayedCards(
    cards: T[] | null,
    color?: string,
    cardClass?: string,
  ): void;
  /**
   * Place a card based on the autoPlace settings of each stock.
   */
  placeCard(card: T): Promise<boolean>;
  /**
   * Place some cards based on the autoPlace settings of each stock.
   */
  placeCards(cards: T[]): Promise<Promise<boolean>[]>;
}

interface AllVisibleDeckSettings<T> extends CardStockSettings<T> {
  /**
   * The shift between each card (default 3). Will be ignored if verticalShift and horizontalShift are set.
   */
  shift?: string;
  /**
   * The vertical shift between each card (default 3). Overrides shift.
   */
  verticalShift?: string;
  /**
   * The horizontal shift between each card (default 3). Overrides shift.
   */
  horizontalShift?: string;
  /**
   * The direction when it expands (default 'vertical')
   */
  direction?: "vertical" | "horizontal";
}
/**
 * Stock to represent a deck, where the player can see all cards by hovering or pressing it.
 */
declare class AllVisibleDeck<T> extends CardStock<T> {
  protected manager: CardManager<T>;
  protected element: HTMLElement;
  constructor(
    manager: CardManager<T>,
    element: HTMLElement,
    settings: AllVisibleDeckSettings<T>,
  );
  addCard(card: T, settings?: AddCardSettings): Promise<boolean>;
  /**
   * Set opened state. If true, all cards will be entirely visible.
   *
   * @param opened indicate if deck must be always opened. If false, will open only on hover/touch
   */
  setOpened(opened: boolean): void;
  cardRemoved(card: T): void;
  /**
   * Updates the cards number, if the counter is visible.
   */
  protected cardNumberUpdated(): void;
}

interface DeckSettings<T> extends CardStockSettings<T> {
  /**
   * Indicate the current top card.
   */
  topCard?: T;
  /**
   * Indicate the current number of cards in the deck (default 0).
   */
  cardNumber?: number;
  /**
   * Indicate if the card count is automatically updated when a card is added or removed.
   */
  autoUpdateCardNumber?: boolean;
  /**
   * Indicate if the cards under the new top card must be removed (to forbid players to check the content of the deck with Inspect). Default true.
   */
  autoRemovePreviousCards?: boolean;
  /**
   * Indicate the thresholds to add 1px to the thickness of the pile. Default [0, 2, 5, 10, 20, 30].
   */
  thicknesses?: number[];
  /**
   * Shadow direction. Default 'bottom-right'.
   */
  shadowDirection?: SideOrAngle;
  /**
   * A generator of fake cards, to generate decks top card automatically.
   * Default is manager `fakeCardGenerator` method.
   *
   * @param deckId the deck id
   * @return the fake card to be generated (usually, only informations to show back side)
   */
  fakeCardGenerator?: (deckId: string) => T;
}
interface AddCardToDeckSettings extends AddCardSettings {
  /**
   * Indicate if the cards under the new top card must be removed (to forbid players to check the content of the deck with Inspect). Default true.
   */
  autoRemovePreviousCards?: boolean;
}
interface RemoveCardFromDeckSettings extends RemoveCardSettings {
  /**
   * Indicate if the card count is automatically updated when a card is added or removed.
   */
  autoUpdateCardNumber?: boolean;
}
interface ShuffleAnimationSettings<T> {
  /**
   * Number of cards used for the animation (will use cardNumber is inferior to this number).
   * Default: 10.
   */
  animatedCardsMax?: number;
  /**
   * Card generator for the animated card. Should only show the back of the cards.
   * Default if fakeCardGenerator from Deck (or Manager if unset in Deck).
   */
  fakeCardSetter?: (card: T, index: number) => void;
  /**
   * Time to wait after shuffle, in case it is chained with other animations, to let the time to understand it's 2 different animations.
   * Default is 500ms.
   */
  pauseDelayAfterAnimation?: number;
}
/**
 * Stock to represent a deck. (pile of cards, with a fake 3d effect of thickness).
 */
declare class Deck<T> extends CardStock<T> {
  protected manager: CardManager<T>;
  protected element: HTMLElement;
  protected cardNumber: number;
  protected autoUpdateCardNumber: boolean;
  protected autoRemovePreviousCards: boolean;
  protected fakeCardGenerator?: (deckId: string) => T;
  protected thicknesses: number[];
  constructor(
    manager: CardManager<T>,
    element: HTMLElement,
    settings: DeckSettings<T>,
  );
  /**
   * Get the the cards number.
   *
   * @returns the cards number
   */
  getCardNumber(): number;
  /**
   * Set the the cards number.
   *
   * @param cardNumber the cards number
   * @param topCard the deck top card. If unset, will generated a fake card (default). Set it to null to not generate a new topCard.
   */
  setCardNumber(
    cardNumber: number,
    topCard?: T | null | undefined,
  ): Promise<boolean>;
  addCard(card: T, settings?: AddCardToDeckSettings): Promise<boolean>;
  cardRemoved(card: T, settings?: RemoveCardFromDeckSettings): void;
  removeAll(settings?: RemoveCardFromDeckSettings): Promise<boolean>;
  getTopCard(): T | null;
  /**
   * Shows a shuffle animation on the deck
   *
   * @param settings a `ShuffleAnimationSettings` object
   * @returns promise when animation ends
   */
  shuffle(settings?: ShuffleAnimationSettings<T>): Promise<boolean>;
  protected getFakeCard(): T;
  /**
   * Returns the card count in the deck (what the player think there is, for decks, the real number of cards for all visible card stocks).
   *
   * @returns the number of card in the stock
   */
  getCardCount(): number;
}

interface DiscardDeckSettings<T> extends CardStockSettings<T> {
  /**
   * Max horizontal shift from the center (in % of the card width). Default 5.
   */
  maxHorizontalShift?: number;
  /**
   * Max vertical shift from the center (in % of the card height). Default 5.
   */
  maxVerticalShift?: number;
  /**
   * Max rotation (in deg). Default 5.
   */
  maxRotation?: number;
}
/**
 * Stock to represent a discard deck. The cards are not perfectly aligned to represent the discard state.
 *
 * you can control the disalignment by setting the values of the `DiscardDeckSettings`.
 */
declare class DiscardDeck<T> extends CardStock<T> {
  protected manager: CardManager<T>;
  protected element: HTMLElement;
  protected maxHorizontalShift: number;
  protected maxVerticalShift: number;
  protected maxRotation: number;
  constructor(
    manager: CardManager<T>,
    element: HTMLElement,
    settings?: DiscardDeckSettings<T>,
  );
  protected getRand(min: number, max: number): number;
  protected getMargins(): {
    horizontalMargin: number;
    verticalMargin: number;
  };
  addCard(card: T, settings?: AddCardSettings): Promise<boolean>;
}

interface LineStockSettings<T> extends CardStockSettings<T> {
  /**
   * Indicate if the line should wrap when needed (default wrap)
   */
  wrap?: "wrap" | "nowrap";
  /**
   * Indicate the line direction (default row)
   */
  direction?: "row" | "column";
  /**
   * indicate if the line should be centered (default yes)
   */
  center?: boolean;
  /**
   * CSS to set the gap between cards. '8px' if unset.
   */
  gap?: string;
}
/**
 * A basic stock for a list of cards, based on flex.
 */
declare class LineStock<T> extends CardStock<T> {
  protected manager: CardManager<T>;
  protected element: HTMLElement;
  /**
   * @param manager the card manager
   * @param element the stock element (should be an empty HTML Element)
   * @param settings a `LineStockSettings` object
   */
  constructor(
    manager: CardManager<T>,
    element: HTMLElement,
    settings?: LineStockSettings<T>,
  );
}

interface SlotStockSettings<T> extends LineStockSettings<T> {
  /**
   * The ids for the slots (can be number or string)
   */
  slotsIds: SlotId[];
  /**
   * The classes to apply to each slot
   */
  slotClasses?: string[];
  /**
   * How to place the card on a slot automatically
   */
  mapCardToSlot: (card: T) => SlotId;
  /**
   * The style to apply to selectable slots. Use class from manager is unset.
   */
  selectableSlotStyle?: SelectionStyle;
  /**
   * The style to apply to unselectable slots. Use class from manager is unset.
   */
  unselectableSlotStyle?: SelectionStyle;
  /**
   * The style to apply to selected slots. Use class from manager is unset.
   */
  selectedSlotStyle?: SelectionStyle;
}
type SlotId = number | string;
interface AddCardToSlotSettings extends AddCardSettings {
  /**
   * The slot to place the card on.
   */
  slot?: SlotId;
}
/**
 * A stock with fixed slots (some can be empty)
 */
declare class SlotStock<T> extends LineStock<T> {
  protected manager: CardManager<T>;
  protected element: HTMLElement;
  protected slotsIds: SlotId[];
  protected slots: HTMLDivElement[];
  protected slotClasses: string[];
  protected mapCardToSlot: (card: T) => SlotId;
  protected selectedSlots: SlotId[];
  protected slotSelectionMode: CardSelectionMode;
  /**
   * Called when the slot selection change. Returns the selection.
   *
   * selection: the selected SlotId of the stock
   * lastChange: the last change on selection slot (can be selected or unselected)
   */
  onSlotSelectionChange?: (
    selection: SlotId[],
    lastChange: SlotId | null,
  ) => void;
  /**
   * Called when slot selection change. Returns the clicked slot.
   *
   * slot: the clicked slot (can be selected or unselected)
   */
  onSlotClick?: (slotId: SlotId) => void;
  /**
   * @param manager the card manager
   * @param element the stock element (should be an empty HTML Element)
   * @param settings a `SlotStockSettings` object
   */
  constructor(
    manager: CardManager<T>,
    element: HTMLElement,
    settings: SlotStockSettings<T>,
  );
  protected createSlot(slotId: SlotId): void;
  /**
   * Add a card to the stock.
   *
   * @param card the card to add
   * @param settings a `AddCardToSlotSettings` object
   * @returns the promise when the animation is done (true if it was animated, false if it wasn't)
   */
  addCard(card: T, settings?: AddCardToSlotSettings): Promise<boolean>;
  getSlotsIds(): SlotId[];
  /**
   * Change the slots ids. Will empty the stock before re-creating the slots.
   *
   * @param slotsIds the new slotsIds. Will replace the old ones.
   */
  setSlotsIds(slotsIds: SlotId[]): void;
  removeSlot(slotId: SlotId): void;
  /**
   * Add new slots ids. Will not change nor empty the existing ones.
   *
   * @param newSlotsIds the new slotsIds. Will be merged with the old ones.
   */
  addSlotsIds(newSlotsIds: SlotId[]): void;
  /**
   * @returns the style to apply to selectable slots. Use style from manager is unset.
   */
  getSelectableSlotStyle(): SelectionStyle;
  /**
   * @returns the style to apply to selectable slots. Use style from manager is unset.
   */
  getUnselectableSlotStyle(): SelectionStyle;
  /**
   * @returns the style to apply to selected slots. Use style from manager is unset.
   */
  getSelectedSlotStyle(): SelectionStyle;
  protected canAddCard(card: T, settings?: AddCardToSlotSettings): boolean;
  /**
   * Swap cards inside the slot stock.
   *
   * @param cards the cards to swap
   * @param settings for `updateInformations` and `selectable`
   */
  swapCards(cards: T[], settings?: AddCardSettings): any;
  /**
   * Set if the stock slot are selectable, and if yes if it can be multiple.
   * If set to 'none', it will unselect all selected slots.
   *
   * @param selectionMode the selection mode
   * @param selectableSlots the selectable slats (all if unset). Calls `setSelectableSlots` method
   */
  setSlotSelectionMode(
    selectionMode: CardSelectionMode,
    selectableSlots?: SlotId[],
  ): void;
  removeSlotSelectionClasses(slotId: SlotId): void;
  removeSlotSelectionClassesFromElement(slotElement: HTMLElement): void;
  protected setSelectableSlot(slotId: SlotId, selectable: boolean): void;
  /**
   * Set the selectable class for each slot.
   *
   * @param slotIds the selectable slots. If unset, all slots are marked selectable. Default unset.
   */
  setSelectableSlots(slotIds?: SlotId[]): void;
  /**
   * Set selected state to a slot.
   *
   * @param slotId the slot to select
   */
  selectSlot(slotId: SlotId): void;
  /**
   * Set unselected state to a slot.
   *
   * @param slotId the slot to unselect
   */
  unselectSlot(slotId: SlotId): void;
  /**
   * Select all slots
   */
  selectAllSlots(): void;
  /**
   * Unselect all slots
   */
  unselectAllSlots(): void;
  /**
   * @returns the selected slots
   */
  getSlotSelection(): SlotId[];
  /**
   * @returns if the slot is selectd
   */
  isSlotSelected(slotId: SlotId): boolean;
}

type GridStockCoordinates = {
  x: number;
  y: number;
};
interface GridStockSettings<T> extends SlotStockSettings<T> {
  /**
   * How to place the card on a slot automatically
   */
  mapCardToCoordinates?: (card: T) => GridStockCoordinates;
  /**
   * Define the minX for the grid. Useful if the grid is of a fixed size.
   */
  minX?: number;
  /**
   * Define the minY for the grid. Useful if the grid is of a fixed size.
   */
  minY?: number;
  /**
   * Define the maxX for the grid. Useful if the grid is of a fixed size.
   */
  maxX?: number;
  /**
   * Define the maxY for the grid. Useful if the grid is of a fixed size.
   */
  maxY?: number;
}
interface AddCardToGridSettings extends AddCardToSlotSettings {
  /**
   * The coordinates to place the card on.
   */
  coordinates: GridStockCoordinates;
}
/**
 * A grid stock with fixed slots (some can be empty)
 */
declare class GridStock<T> extends SlotStock<T> {
  protected manager: CardManager<T>;
  protected element: HTMLElement;
  protected minX: number | null;
  protected minY: number | null;
  protected maxX: number | null;
  protected maxY: number | null;
  protected mapCardToCoordinates: (card: T) => GridStockCoordinates;
  /**
   * @param manager the card manager
   * @param element the stock element (should be an empty HTML Element)
   * @param settings a `GridStockSettings` object
   */
  constructor(
    manager: CardManager<T>,
    element: HTMLElement,
    settings: GridStockSettings<T>,
  );
  /**
   * Return the slotId based on the coordinates
   */
  protected getGridSlotId(coordinates: GridStockCoordinates): string;
  protected createSlot(slotId: SlotId): void;
  addCard(card: T, settings?: AddCardToGridSettings): Promise<boolean>;
  /**
   * Expand the grid until a slot exists for the given coordinates.
   */
  makeSlotForCoordinates(coordinates: GridStockCoordinates): void;
  /**
   * Expand the grid until slots exists for the given coordinates.
   */
  makeSlotsForCoordinates(coordinatesList: GridStockCoordinates[]): void;
  getMinX(): number;
  getMinY(): number;
  getMaxX(): number;
  getMaxY(): number;
  /**
   * Expand the grid until slots exists for the given x.
   */
  extendToX(x: number): void;
  /**
   * Expand the grid until slots exists for the given y.
   */
  extendToY(y: number): void;
  /**
   * Must be called each time new slots are created.
   */
  protected updateGridTemplateAreas(): void;
  addSlotsIds(newSlotsIds: string[]): void;
  /**
   * Add slots to the left of the grid.
   */
  addColumnToTheLeft(): void;
  /**
   * Add slots to the right of the grid.
   */
  addColumnToTheRight(): void;
  /**
   * Add slots to the top of the grid.
   */
  addRowToTheTop(): void;
  /**
   * Add slots to the bottom of the grid.
   */
  addRowToTheBottom(): void;
  /**
   * Remove the slots on the leftmost column of the grid. Remove the cards in it if there are some.
   */
  removeLeftmostColumn(): void;
  /**
   * Remove the slots on the rightmost column of the grid. Remove the cards in it if there are some.
   */
  removeRightmostColumn(): void;
  /**
   * Remove the slots on the top row of the grid. Remove the cards in it if there are some.
   */
  removeTopRow(): void;
  /**
   * Remove the slots on the bottom row of the grid. Remove the cards in it if there are some.
   */
  removeBottomRow(): void;
  /**
   * Returns true if a grid slot already exists
   */
  gridSlotExists(coordinates: GridStockCoordinates): boolean;
  protected setSelectableGridSlot(
    coordinates: GridStockCoordinates,
    selectable: boolean,
  ): void;
  setSelectableGridSlots(coordinates?: GridStockCoordinates[]): void;
  setGridSlotSelectionMode(
    selectionMode: CardSelectionMode,
    selectableCoordinates?: GridStockCoordinates[],
  ): void;
  /**
   * Remove all slots at the border (top/bottom lines and left/right columns) until there is no unnecessary space surrounding the cards.
   */
  removeEmptySurroundingSlots(): void;
}

interface HandStockSettings<T> extends CardStockSettings<T> {
  /**
   * Card overlap, % of the card width. Default 25.
   */
  cardOverlap?: number;
  /**
   * If the cards should be fan-shaped. Default true.
   */
  fanShaped?: boolean;
  /**
   * Message to display if the hand is empty. Default null.
   */
  emptyHandMessage?: string;
  /**
   * A margin to add to the left of the floating hand, for example if you have a help button floating on the bottom left corner of the screen.
   */
  floatLeftMargin?: number;
  /**
   * A margin to add to the right of the floating hand.
   */
  floatRightMargin?: number;
  /**
   * A z-index to add to the floating hand.
   */
  floatZIndex?: number;
}
/**
 * A stock representing the player hand.
 *
 * If the stock is not visible because it is under the viewport, it will be floating at the bottom of the viewport.
 */
declare class HandStock<T> extends CardStock<T> {
  protected manager: CardManager<T>;
  protected settings: HandStockSettings<T>;
  protected minOverlap: number;
  protected fanShaped: boolean;
  protected holder: HTMLElement;
  protected floatingThreshold: number;
  protected floating: boolean;
  protected height: number;
  protected maxY: number;
  protected lastHandWidth: number;
  protected emptyHandDiv: HTMLElement | null;
  constructor(
    manager: CardManager<T>,
    element: HTMLElement,
    settings: HandStockSettings<T>,
  );
  /**
   * Triggered after card order is changed, when setting a new sort function.
   */
  protected cardOrderChanged(): void;
  /**
   * Create an IntersectionObserver, detecting if the holder is below the screen frame.
   * If it's the case, the hand is made floating, else it's reattached to the holder.
   */
  protected watchFloatingState(): void;
  protected watchHandSize(): void;
  addCard(card: T, settings?: AddCardSettings): Promise<boolean>;
  cardRemoved(card: T, settings?: RemoveCardSettings): void;
  protected getMiddleIndexes(cards: T[]): number[];
  /**
   * Updates the y and angle of each card to keep it fan-shaped.
   */
  protected updateCardPositions(): void;
  /**
   * Get the y and angle of a card.
   */
  protected getCardTransform(
    middleIndex: number,
    cardCount: number,
  ): {
    y: number;
    a: number;
  };
}

/**
 * A stock with manually placed cards
 */
declare class ManualPositionStock<T> extends CardStock<T> {
  protected manager: CardManager<T>;
  protected element: HTMLElement;
  protected updateDisplay: (
    element: HTMLElement,
    cards: T[],
    lastCard: T,
    stock: ManualPositionStock<T>,
  ) => any;
  /**
   * @param manager the card manager
   * @param element the stock element (should be an empty HTML Element)
   */
  constructor(
    manager: CardManager<T>,
    element: HTMLElement,
    settings: CardStockSettings<T>,
    updateDisplay: (
      element: HTMLElement,
      cards: T[],
      lastCard: T,
      stock: ManualPositionStock<T>,
    ) => any,
  );
  /**
   * Add a card to the stock.
   *
   * @param card the card to add
   * @param settings a `AddCardSettings` object
   * @returns the promise when the animation is done (true if it was animated, false if it wasn't)
   */
  addCard(card: T, settings?: AddCardSettings): Promise<boolean>;
  cardRemoved(card: T, settings?: RemoveCardSettings): void;
}

interface ScrollableStockButtonSettings {
  /**
   * The HTML applied in the button
   */
  html?: string;
  /**
   * The classes added the button
   */
  classes?: string[];
}
interface ScrollableStockSettings<T> extends CardStockSettings<T> {
  /**
   * Setting for the left button
   */
  leftButton: ScrollableStockButtonSettings;
  /**
   * Setting for the right button
   */
  rightButton: ScrollableStockButtonSettings;
  /**
   * indicate the scroll (in px) when clicking the buttons
   */
  scrollStep?: number;
  /**
   * indicate if the scrollbar is visible (default true)
   */
  scrollbarVisible?: boolean;
  /**
   * CSS to set the gap between the buttons and the card container. '0' if unset.
   */
  buttonGap?: string;
  /**
   * indicate if the line should be centered (default yes)
   */
  center?: boolean;
  /**
   * CSS to set the gap between cards. '8px' if unset.
   */
  gap?: string;
}
/**
 * A stock with button to scroll left/right if content is bigger than available width
 */
declare class ScrollableStock<T> extends CardStock<T> {
  protected manager: CardManager<T>;
  protected scrollStep: number;
  protected element: HTMLElement;
  /**
   * @param manager the card manager
   * @param elementWrapper the stock element (should be an empty HTML Element)
   * @param settings a `SlotStockSettings` object
   */
  constructor(
    manager: CardManager<T>,
    elementWrapper: HTMLElement,
    settings: ScrollableStockSettings<T>,
  );
  protected createButton(
    side: "left" | "right",
    settings: ScrollableStockButtonSettings,
  ): HTMLButtonElement;
  protected scroll(side: "left" | "right"): void;
}

interface AddCardToVoidStockSettings extends AddCardSettings {
  /**
   * Removes the card after adding.
   * Set to false if you want to add the card to the void to stock to animate it to another stock just after.
   * Default true
   */
  remove?: boolean;
}
/**
 * A stock to make cards disappear (to automatically remove discarded cards, or to represent a bag)
 */
declare class VoidStock<T> extends CardStock<T> {
  protected manager: CardManager<T>;
  protected element: HTMLElement;
  /**
   * @param manager the card manager
   * @param element the stock element (should be an empty HTML Element)
   */
  constructor(manager: CardManager<T>, element: HTMLElement);
  /**
   * Add a card to the stock.
   *
   * @param card the card to add
   * @param settings a `AddCardToVoidStockSettings` object
   * @returns the promise when the animation is done (true if it was animated, false if it wasn't)
   */
  addCard(card: T, settings?: AddCardToVoidStockSettings): Promise<boolean>;
}

declare const BgaCards: {
  Manager: typeof CardManager;
  sort: typeof sort;
  AllVisibleDeck: typeof AllVisibleDeck;
  CardStock: typeof CardStock;
  Deck: typeof Deck;
  DiscardDeck: typeof DiscardDeck;
  GridStock: typeof GridStock;
  HandStock: typeof HandStock;
  LineStock: typeof LineStock;
  ManualPositionStock: typeof ManualPositionStock;
  ScrollableStock: typeof ScrollableStock;
  SlotStock: typeof SlotStock;
  VoidStock: typeof VoidStock;
};
