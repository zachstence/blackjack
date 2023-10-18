# Gameplay
- Surrender (before and after dealer reveal)
- Even money (https://en.wikipedia.org/wiki/Even_money#:~:text=In%20blackjack%2C%20even%20money%20bet,the%20dealer%20has%20a%20blackjack.)
- Dealer doesn't hit if all players bust
- Dealer doesn't hit if all players get blackjack
- Reset the shoe with 20% left (https://www.reddit.com/r/blackjack/comments/t12sd0/comment/hyejfz1/?utm_source=share&utm_medium=web2x&context=3)
- Config options (configurable by room)
  - Stand/hit on soft 17
  - max players
  - min bet
  - max bet
  - allow card counter
  - allow coach mode
  - expected player win rate based on options
- vs mode playing against other players
- levelling and get coins
- dealer's second card is upcard, not first
- customizable insurance bet


# Technical
- Tests to prevent regressions
- Refactor to have separate types for Server-side game state and Client-side game state, and a converter
- Refactor to OOP instead of Functional, there's a ton of computed state that would be more ergonomic in class getters
- Error handling, don't crash server on errors
- Don't pay 3:2 for blackjack on a split hand
- Since players can have multiple hands, move all the authority of playing into the Hand, and give it functions to take or give money to its player
  - Hands should be a root object in game rather than being nested within the player
- Don't give player or dealer a hand until they bet. Betting is what creates the hand.


# QOL
- Player can play multiple hands at once
- Admin tools (kick player, change money)
- Have connection quality indicator, ping time
- Timeout for users to bet between rounds, automatically start without them
- Timeout for user to hit or stand, kick if they don't act in time
- auto deal: keeps your same bet
- player chat
- show round outcome in player chat
- tip dealer
- rooms
  - public room joinable by anybody
  - private room joinable by link/code
- Let a player place a cut card (https://www.reddit.com/r/blackjack/comments/t12sd0/comment/hyejfz1/?utm_source=share&utm_medium=web2x&context=3)
- daily challenge to play optimally 
- emotes like Google meet
- coach mode will show percentage of success under each button
- Card counting helper
- coach mode with counting cards enabled will show card count and adjust percentages based on the count
- allow showing currency other than USD in UI (only client side)


# UI
- configurable card backs and/or fronts
- customize table color
- dark mode
- confetti effect on player blackjack
- timeout indicator ring or timer countdown
- responsiveness / PWA
- depressable css buttons
  - search codepen for ideas
  - "3d button"
- confetti on blackjack
- show chips for users bet
  - will have to determine the optimal denominations for a users cash level
- animate money going up/down
- chat in separate sidebar or maybe in bottom right/left or something


# Stats
- track every hand played in a DB to compute fun stats
  - include dealer hand, player hand, player id, and money won
- chart that shows a players strategy, how close they are to optimal strategy
- stats: user average bet
- maybe use evidence for analytics of the game? Rebuild static site every day with new data?
- track user bet speed
- show win rate
- show hand history in sidebar
- show most common misplays


# Bots
- implement blackjack bot
- bot can play at different difficulty levels, controls how optimally they play
- put bot in empty room with person to make it seem more popular


# Achievements
- play x optimal hands in a row
- beat dealer on both hands of a split
- beat dealer on a double
- beat dealer on both hands of a doubled split
- get x blackjacks
- win hand with x cards (2, 3, 4, 5, 6, etc)
- get a hand with x aces (2, 3, 4, etc)
- play x hands overall
- play x hands in a session
- win x amount of money
- lose x amount of money
- push x times in a row
- win x hands in a row
- lose x hands in a row
- all players win at a table of x people
- send x chat messages
- tip dealer x times
- tip dealer x amount
- bet x amount
- win on all in
- get blackjack on all in
