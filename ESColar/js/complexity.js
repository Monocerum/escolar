function aStarSearch(campus_map, origin, destination) {
    // Monitor exploration with two lists: priority queue for nodes to explore and set for explored nodes.
    var toExplore = new PriorityQueue();
    var explored = new Set();

    const vw = 10;
    const dw = 1;

    // Initializes the g-score of the origin node to 0, as distance from itself to itself is always 0.
    campus_map.gscore.set(origin, 0);
    // Initialize the h-score of the origin node to destination node.
    campus_map.hscore.set(origin, heuristic(origin, destination, campus_map.vertexInfo));
    campus_map.fscore.set(origin, campus_map.gscore.get(origin) + campus_map.hscore.get(origin));

    // Enqueue/Add the origin and destination node to nodes to explore.
    toExplore.enqueue(origin, campus_map.fscore.get(origin));

    // While set of nodes to explore is not empty...
    while (!toExplore.isEmpty()) {
      // Dequeue the first item in the queue and make it current node to explore.
      let current = toExplore.dequeue();

      // If destination node has been reached...
      if (current === destination) {
        // 1
        // Draw the path found by the algorithm
        const path = drawPath(campus_map, current, campus_map.vertexInfo.get(current).id);
        return path;
      }

      // Current node is added to list of explored nodes
      explored.add(current);

      let adjacencyList = campus_map.adjacent.get(current);
      if (!adjacencyList) {
        // If adjacent node has no adjacent nodes, skip.
        console.log("No adjacency list found for node:", current);
        continue;
      }

      if (campus_map.adjacent.has(current)) {
        // 1
        adjacencyList.forEach(({ node: adjacency, edge_cost }) => {
          // m (nodes in adjacency list)                                             // n (number of nodes in adjacency list)
          console.log("Processing adjacency:", adjacency, "with edge cost:", edge_cost);
          // If adjacent node has already been explored, skip node and proceed to next.
          if (explored.has(adjacency) || campus_map.vertexInfo.get(adjacency).vulnerabilityLevel === 3) {
            // 1
            // If adjacency has already been explored or all adjacent nodes are highly vulnerable, skip.
            console.log("Adjacency has already been explored.");
            return;
          }

          let current_node = campus_map.vertexInfo.get(current);
          let origin_node = campus_map.vertexInfo.get(origin);
          let next_node = campus_map.vertexInfo.get(adjacency);
          let destination_node = campus_map.vertexInfo.get(destination);

          // Initialize temporary variable for g-score that must include all that is being considered; in which case, we are considering the distance and the vulnerability, so...
          let temp = campus_map.gscore.get(current) + calculateEdge(current_node.x, current_node.y, next_node.x, next_node.y, 2) + campus_map.vertexInfo.get(adjacency).vulnerabilityLevel * vw;

          // Only update the path to adjacent node only if it is shorter than previous paths.
          // If the current g-score is less than the adjacent node's g-score...
          if (temp < campus_map.gscore.get(adjacency)) {
            // Current node will become the parent node of the adjacent node.
            campus_map.parent.set(adjacency, current);
            // Compute g-score of adjacent node.
            campus_map.gscore.set(adjacency, temp);
            // Compute the h-score of adjacent node.
            campus_map.hscore.set(adjacency, heuristic(adjacency, destination, campus_map.vertexInfo));

            let actual_cost = calculateEdge(next_node.x, next_node.y, destination_node.x, destination_node.y, 2) + campus_map.vertexInfo.get(adjacency).vulnerabilityLevel * vw;
            let actual_cost_from_origin = campus_map.gscore.get(adjacency) + actual_cost;

            // Check if heuristic is admissible.
            if (campus_map.hscore.get(adjacency) > actual_cost) {
              console.log("Heuristic is not admissible!");
            }

            // Compute the f-score of adjacent node.
            campus_map.fscore.set(adjacency, campus_map.gscore.get(adjacency) + campus_map.hscore.get(adjacency));

            if (campus_map.fscore.get(adjacency) > actual_cost_from_origin) {
              console.log("Heuristic is not admissible!");
            }

            // If the adjacent node of current node is not yet in the list of nodes to be explored...
            if (!toExplore.nodes.find((node) => node.node === adjacency)) {
              // Add the adjacent node to list of nodes to explore.
              toExplore.enqueue(adjacency, campus_map.fscore.get(adjacency));
            }
          }
        });
      }
    }
    
    return [];
  }