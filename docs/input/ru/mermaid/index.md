# Mermaid

Mermaid diagrams render as interactive SVG visualizations from fenced code blocks.

## Flowchart

A basic top-to-bottom flowchart with styled nodes and edges.

{#flowchart}
```mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process A]
    B -->|No| D[Process B]
    C --> E[End]
    D --> E
```

## Sequence Diagram

A sequence diagram showing message exchange between participants.

{#sequence}
```mermaid
sequenceDiagram
    participant Alice
    participant Bob
    Alice->>Bob: Hello Bob!
    Bob-->>Alice: Hello Alice!
    Alice->>Bob: How are you?
    Bob-->>Alice: I am fine, thanks!
```

## Class Diagram

A class diagram showing inheritance and composition relationships.

{#class-diagram}
```mermaid
classDiagram
    Animal <|-- Dog
    Animal <|-- Cat
    Animal : +String name
    Animal : +int age
    Animal : +makeSound()
    Dog : +fetch()
    Cat : +scratch()
```

## State Diagram

A state transition diagram for a turnstile finite state machine.

{#state-diagram}
```mermaid
stateDiagram-v2
    [*] --> Locked
    Locked --> Unlocked : Coin
    Unlocked --> Locked : Push
    Unlocked --> [*]
    Locked --> [*]
```

## Pie Chart

A pie chart showing market share distribution.

{#pie-chart}
```mermaid
pie title Market Share
    "Product A" : 40
    "Product B" : 30
    "Product C" : 20
    "Others" : 10
```

## Styled Flowchart

A flowchart with custom class definitions for node styling.

{#styled-flowchart}
```mermaid
graph TB
    P(["Incoming"]):::orange
    A1["Process Step One"]:::blue
    A2["Process Step Two"]:::blue

    P --> A1
    A1 --> A2

    classDef orange fill:#ffeee7,stroke:#ffeee7,stroke-width:2px;
    classDef blue fill:#deebff,stroke:#deebff,stroke-width:2px,rx:5,ry:5;
```

## Git Graph

A git commit graph showing branch and merge history.

{#git-graph}
```mermaid
gitGraph
    commit
    commit
    branch develop
    checkout develop
    commit
    checkout main
    merge develop
    commit
```

## Non-Mermaid Code Block

A regular JavaScript code block that should NOT be transformed as a mermaid diagram.

{#regular-code}
```javascript
const x = 42;
console.log(x);
```

## Multiple Diagrams

Two diagrams in one section to verify batch processing.

{#multiple}
```mermaid
graph LR
    X --> Y
```

```mermaid
graph RL
    Y --> X
```
