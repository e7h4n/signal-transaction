# AbortSignal based Transaction Utils

[![CI](https://github.com/e7h4n/signal-transaction/actions/workflows/ci.yaml/badge.svg)](https://github.com/e7h4n/signal-transaction/actions/workflows/ci.yaml) [![Coverage Status](https://coveralls.io/repos/github/e7h4n/signal-transaction/badge.svg?branch=main)](https://coveralls.io/github/e7h4n/signal-transaction?branch=main) ![NPM Version](https://img.shields.io/npm/v/signal-transaction) [![Maintainability](https://api.codeclimate.com/v1/badges/b3b1d4e4fb96c3ac5023/maintainability)](https://codeclimate.com/github/e7h4n/signal-transaction/maintainability)

`signal-transaction` is a lightweight utility designed to manage actions within a transactional scope. It ensures that if an `AbortSignal` is triggered, all registered rollback actions are executed, providing a clean, transaction-like flow for async operations.

## Features

- **Transaction Management:** Define actions with associated rollback (cleanup) procedures.
- **Abort Signal Handling:** Automatically manage rollbacks and cleanups when a transaction is aborted.
- **Easy Integration:** Works seamlessly with native `AbortSignal` in both Node.js and browser environments.

## Installation

Install via npm, yarn, or pnpm:

```bash
npm install signal-transaction
yarn add signal-transaction
pnpm add signal-transaction
```

## Usage

### Basic Example

```ts
import { transaction } from 'signal-transaction';

// Create an AbortController to control the transaction
const controller = new AbortController();
const signal = controller.signal;

// Initialize the transaction
const { act, finish } = transaction(signal);

// Define an action with an optional rollback
act(() => {
    console.log('Action 1 executed');
    return () => {
        console.log('Action 1 rolled back');
    };
});

// Use finish to finalize the transaction or run a final action
finish(() => {
    console.log('Final action executed');
});
```

### Aborting a Transaction

You can abort the transaction by calling `controller.abort()`. This triggers all rollback actions tied to the transaction.

```ts
controller.abort(); // All rollback actions will be triggered
```

## API Reference

### `transaction(signal: AbortSignal): Transaction`

Creates a transaction object to manage your actions and rollbacks.

#### Transaction Methods:

- **`act(action: Action)`**  
  Executes the action if the signal is not aborted. If a rollback function is returned, it is bound to the abort event.

- **`finish(action?: Action)`**  
  Completes the transaction and optionally executes a final action. All registered rollback callbacks are removed afterward, ensuring that no additional cleanups occur after the transaction is finished.

### Types

- **`Action`**  
  A function that can optionally return a rollback function (of type `ActionRollback`).

- **`ActionRollback`**  
  A function to be executed if the `AbortSignal` is triggered (typically a cleanup function).

## Examples

### Example: Managing Points with Rollback

Suppose you're managing a game where players earn and lose points. When a player gains points (side effect), you also want the ability to rollback those points if needed.

```ts
import { transaction } from 'signal-transaction';

const controller = new AbortController();
const signal = controller.signal;
let score = 0;

// Start a transaction
const { act } = transaction(signal);

// A player gains a point
act(() => {
    score += 1;
    console.log(`Player gained a point! Current score: ${score}`);
    
    // Rollback if necessary
    return () => {
        score -= 1;
        console.log(`Rollback! Point deducted. Current score: ${score}`);
    };
});

// Later in the game, something goes wrong and we abort the transaction
controller.abort();  // Rolls back the action
// Output:
// Rollback! Point deducted. Current score: 0
```

### Example: Chaining Actions with Rollbacks

In this scenario, you’re building a character in a game. Each step (name, class, equipment) can be rolled back if something goes wrong.

```ts
import { transaction } from 'signal-transaction';

const controller = new AbortController();
const signal = controller.signal;

let character = { name: '', class: '', equipment: [] };
const { act } = transaction(signal);

// Build the character step by step
act(() => {
    character.name = 'Aragorn';
    console.log(`Character named: ${character.name}`);

    return () => {
        character.name = '';
        console.log(`Name reset: ${character.name}`);
    };
});

act(() => {
    character.class = 'Ranger';
    console.log(`Character class: ${character.class}`);

    return () => {
        character.class = '';
        console.log(`Class reset: ${character.class}`);
    };
});

act(() => {
    character.equipment.push('Sword', 'Shield');
    console.log(`Equipment: ${character.equipment}`);

    return () => {
        character.equipment = [];
        console.log(`Equipment reset: ${character.equipment}`);
    };
});

// Something goes wrong! Roll everything back
controller.abort();
// Output:
// Name reset: 
// Class reset: 
// Equipment reset: []
```

### Example: Finalizing with `finish()` and Handling Aborts

`finish()` allows you to finalize a transaction without triggering previously registered rollback functions. Instead of executing all the previous rollbacks, `finish()` simply removes them from the `AbortSignal`'s listeners and registers a new rollback function, if provided.

```ts
import { transaction } from 'signal-transaction';

const controller = new AbortController();
const signal = controller.signal;
const { act, finish } = transaction(signal);

const cleanupLog = (task) => {
    console.log(`Cleaning up after: ${task}`);
};

// Add multiple tasks with rollback
act(() => {
    console.log('Task 1: Prepare the ingredients');
    return () => cleanupLog('Prepare the ingredients');
});

act(() => {
    console.log('Task 2: Cook the meal');
    return () => cleanupLog('Cook the meal');
});

// Finalize the transaction, cleaning up old rollbacks and registering a new one
finish(() => {
    console.log('Task complete: Serve the meal');
    return () => {
        console.log('Cleanup: Dismantle the kitchen');
    };
});

// Output:
// Task 1: Prepare the ingredients
// Task 2: Cook the meal
// Task complete: Serve the meal

controller.abort(); 
// Output:
// Cleanup: Dismantle the kitchen
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
