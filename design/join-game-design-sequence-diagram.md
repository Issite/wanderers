```mermaid
sequenceDiagram
actor User
participant Game
participant Tribe
participant Totem
participant Tribesman

User->>Game: Enter Tribe name and team code
Game->>Tribe: Create new tribe with given name and team code
Game->>Totem: Spawn totem for the tribe
Game->>Tribesman: Spawn one axe tribesman and one bow tribesman for the tribe
```