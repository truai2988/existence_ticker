# Existence Ticker (自律分散型互助生態系)

**Proprietary & Confidential**
_Designed for The Mutual Aid Economic Zone_

The **Existence Ticker** is a protocol designed to visualize and circulate "Warmth" (Lumen/Lm) within a closed economic environment. It operates on the principles of **Absolute Stillness** and **Global Metabolism**, ensuring that value is generated through existence and mutual aid, rather than speculation.

## Core Philosophy

- **Lumen (Lm)**: The currency of warmth. Generated at a rate of roughly 1 Lm per heartbeat (variable).
- **Absolute Stillness**: The interface reflects the "Silence of the Void." Values decay quietly and strictly update only once per hour (3,600,000ms), reducing cognitive load and fostering a calm engagement.
- **Global Metabolism (Solar Return)**: A system where unspent energy decays and is redistributed to the "Global Supply," ensuring money circulates like blood rather than stagnating.
- **Veil of Anonymity**: A system allowing users to request or offer help without revealing their identity until a commitment is made.

## Technical Stack

- **Frontend**: React (v18), TypeScript, Vite
- **Styling**: Tailwind CSS
- **Backend / Database**: Firebase (Auth, Firestore)
- **State Management**: React Context (Auth, Wishes, Stats)

## Key Features

- **Auth System**: Singleton-based Architecture for stable user sessions.
- **Wallet Physics**:
  - **Integer Representation**: Strict `Math.floor()` usage to represent the "vessel's floor."
  - **O(1) Scalability**: Optimized calculation logic that does not degrade with history size.
- **Admin Console**: "GOD MODE" for visualizing global stats and adjusting the time cycle (Simulated Season).

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Protocol Status

- **Current Version**: v2.0
- **Cycle**: 10 Days (Equinox / Standard)
- **One-Hour Silence**: Active
