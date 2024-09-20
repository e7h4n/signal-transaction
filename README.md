# AbortSignal based Transaction Utils

![NPM Type Definitions](https://img.shields.io/npm/types/signal-transaction)
![NPM Version](https://img.shields.io/npm/v/signal-transaction)
![npm package minimized gzipped size](https://img.shields.io/bundlejs/size/signal-transaction)
[![CI](https://github.com/e7h4n/signal-transaction/actions/workflows/ci.yaml/badge.svg)](https://github.com/e7h4n/signal-transaction/actions/workflows/ci.yaml)
[![Coverage Status](https://coveralls.io/repos/github/e7h4n/signal-transaction/badge.svg?branch=main)](https://coveralls.io/github/e7h4n/signal-transaction?branch=main)
[![Maintainability](https://api.codeclimate.com/v1/badges/b3b1d4e4fb96c3ac5023/maintainability)](https://codeclimate.com/github/e7h4n/signal-transaction/maintainability)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

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

You can abort the transaction by calling `controller.abort()`. This triggers all rollback actions tied to the transaction.

```ts
controller.abort(); // All rollback actions will be triggered
```

### Signal Switch

`createSignalSwitch` creates a mechanism to manage multiple abortable tasks. When a new task is started, it automatically cancels (aborts) any previous task associated with it. This is useful when you want to ensure only the most recent operation is active, while canceling any outdated tasks.

#### Example: Switching Between Tasks

Imagine you're working on a UI where users can select different tasks to run. You want to ensure that only the latest selected task is active, and all previously selected tasks are canceled.

```ts
import { createSignalSwitch, act } from 'signal-transaction';

const controller = new AbortController();
const signalSwitch = createSignalSwitch(controller.signal);

// Simulate a task that changes based on user input
let currentTaskId = 0;

const runTask = signalSwitch((signal) => {
    const { act } = transaction(signal)
    act(() => {
        const taskId = currentTaskId++;
        console.log(`Task ${taskId} started`);

        return () => {
            // If the task is aborted, log the cancellation
            console.log(`Task ${taskId} aborted`);
        }
    })
});

// Start the first task
runTask();
// Output: Task 0 started

// Switch to a new task, automatically aborting the previous one
runTask();
// Output: Task 0 aborted
//         Task 1 started

// Start another task, aborting the second one
runTask();
// Output: Task 1 aborted
//         Task 2 started

// Externally abort all tasks by calling controller.abort()
controller.abort();
// Output: Task 2 aborted
```

In this scenario:
- Every time `runTask()` is called, it starts a new task and aborts the previous one.
- If the user aborts the tasks externally using `controller.abort()`, the current task will be aborted regardless of its state.

## API Reference

### `transaction(signal: AbortSignal): Transaction`

Creates a transaction object to manage your actions and rollbacks.

#### Transaction Methods:

- **`act(action: Action)`**  
  Executes the action if the signal is not aborted. If a rollback function is returned, it is bound to the abort event.

- **`finish(action?: Action)`**  
  Completes the transaction and optionally executes a final action. All registered rollback callbacks are removed afterward, ensuring that no additional cleanups occur after the transaction is finished.

- **`createSignalSwitch`** is a utility that manages multiple abortable tasks by ensuring only the latest task remains active. When a new task is started, it automatically cancels the previous one. This is particularly useful in scenarios where you need to manage consecutive asynchronous operations, such as user interactions or page navigation.

### Types

- **`Action`**  
  A function that can optionally return a rollback function (of type `ActionRollback`).

- **`ActionRollback`**  
  A function to be executed if the `AbortSignal` is triggered (typically a cleanup function).

- **`SignalSwitch`**  
  A function that takes a task function as an argument. The task function receives an `AbortSignal` and optional additional arguments. Only one task can remain active at a time, and previous tasks will be aborted when a new task is started.

## More Examples

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

### Example: Using `signalSwitch` with React-Router Loaders

When navigating between pages in a React application using React-Router, it's useful to cancel ongoing requests to prevent memory leaks or unwanted side effects. By using `signalSwitch`, we can automatically manage the `AbortSignal` for each page's loader method, ensuring that the signal for the previous page is aborted when the user navigates to a new page.

```tsx
import React from 'react';
import { createBrowserRouter, RouterProvider, useLoaderData } from 'react-router-dom';
import { createSignalSwitch } from 'signal-transaction';

const controller = new AbortController();
const signalSwitch = createSignalSwitch(controller.signal);

// A sample loader function using signalSwitch
const fetchDataLoader = signalSwitch(async (signal, { params }) => {
    const response = await fetch(`/api/data/${params.id}`, { signal });
    const data = await response.json();
    signal.throwIfAbort()
    return data;
});

// A simple component that fetches data and displays it
const DataPage = () => {
    const data = useLoaderData();
    return (
        <div>
            <h1>Data for this page</h1>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
};

// Define routes with loaders
const router = createBrowserRouter([
    {
        path: '/data/:id',
        element: <DataPage />,
        loader: fetchDataLoader,
    },
]);

// App component rendering the Router
const App = () => (
    <RouterProvider router={router} />
);

export default App;
```

- **`createSignalSwitch`** is used to wrap the loader function, ensuring that each page load request gets its own `AbortSignal`.
- When the user navigates to a new page, the previous request is automatically aborted, thanks to `signalSwitch`.
- **React-Router's `loader`** method automatically provides parameters like `params` to the loader function, and the signal passed ensures that navigation between pages is efficient and clean.

In this example, when the user navigates from one data page to another, the ongoing fetch request for the first page is canceled, preventing unnecessary resource usage.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
