function aStarSearch(campus_map, origin, destination) {                                           // WORST CASE TIME COMPLEXITY: O(m * n) (16mn + 19n + 6m + 4 + log(n^2)) ||
                                                                                                  // AVERAGE CASE TIME COMPLEXITY: O() (10n + 27m + 19 + log(n))
  // Monitor exploration with two lists: priority queue for nodes to explore and set for explored nodes.
  var toExplore = new PriorityQueue();                                                            // 1 -> initializing an empty PriorityQueue involves initializing an empty array.
  var explored = new Set();                                                                       // 1 -> initializing an empty Set()
    
	const vw = 10;                                                                                  // 1 -> initializing a constant variable

  // Initializes the g-score of the origin node to 0, as distance from itself to itself is always 0.
  campus_map.gscore.set(origin, 0);                                                               // n -> worst-case time complexity for basic map operations || 1 -> average time complexity for basic map operations
  // Initialize the h-score of the origin node to destination node.
  campus_map.hscore.set(origin, heuristic(origin, destination, campus_map.vertexInfo));           // O(n) || n + n or 2n for worst-case, O(1) || 1 + 1 = 2 or for average case 
    
  campus_map.fscore.set(origin, campus_map.gscore.get(origin) + campus_map.hscore.get(origin));   // n + n + n = 3n or O(n) for worst-case, 1 + 1 + 1 = 3 or O(1) for average case

  // Enqueue/Add the origin and destination node to nodes to explore.
  toExplore.enqueue(origin, campus_map.fscore.get(origin));                                       // Note the enqueue function in PriorityQueue, O(log n) will be illustrated as log n
                                                                                                  // n + log n or O(ln) for worst case, 1 + 1 = 2 or O(1) for best case and average case																													
  // While set of nodes to explore is not empty...
  while (!toExplore.isEmpty()) {                                                                  // n or O(n) -> while loop will iterate over all elements in the graph
    // Dequeue the first item in the queue and make it current node to explore.
    let current = toExplore.dequeue();                                                            // O(log n) * n = n log n or O(n log n) -> because it is within the while loop

    // If destination node has been reached...
    if (current === destination) {                                                                // 1 * n = n or O(n) -> because it is within the while loop
      // Draw the path found by the algorithm
      const path = drawPath(campus_map, current, campus_map.vertexInfo.get(current).id);          // Average Case: m or O(m), Worst Case: n or O(n) -> current === destination will only return true once throughout the algorithm, so it will not be dependent on how many times the if statement is executed.
      return path;                                                                                // 1 * n = n or O(n) -> because it is within the while loop
    }

  // Current node is added to list of explored nodes
  explored.add(current);                                                                        // 1 * n or O(n)

  let adjacencyList = campus_map.adjacent.get(current);                                         // 1 * n or O(n)
  if (!adjacencyList) {                                                                         // 1 * n or O(n)
    // If adjacent node has no adjacent nodes, skip.
    console.log("No adjacency list found for node:", current);                                  // 1 * n or O(n)
    continue;                                                                                   // 1 * n or O(n)
  } 

  if (campus_map.adjacent.has(current)) {                                                       // 1 * n or O(n)
    // 1
    adjacencyList.forEach(({ node: adjacency, edge_cost }) => {                                 // 1 * m or O(m), assuming that m is the number of adjacent nodes
			console.log("Processing adjacency:", adjacency, "with edge cost:", edge_cost);            // 1 * m or O(m)
			// If adjacent node has already been explored, skip node and proceed to next.
			if (explored.has(adjacency) || campus_map.vertexInfo.get(adjacency).vulnerabilityLevel === 3) {   // 1 * m or O(m)
			// If adjacency has already been explored or all adjacent nodes are highly vulnerable, skip.
			console.log("Adjacency has already been explored.");                                            // 1 * m or O(m)
			return;
			}

  		let current_node = campus_map.vertexInfo.get(current);                                    // Average Case: 1 * m or O(m), Worst Case: n * m or O(n * m)
      let origin_node = campus_map.vertexInfo.get(origin);                                      // Average Case: 1 * m or O(m), Worst Case: n * m or O(n * m)
      let next_node = campus_map.vertexInfo.get(adjacency);                                     // Average Case: 1 * m or O(m), Worst Case: n * m or O(n * m)
      let destination_node = campus_map.vertexInfo.get(destination);                            // Average Case: 1 * m or O(m), Worst Case: n * m or O(n * m)

      // Initialize temporary variable for g-score that must include all that is being considered; in which case, we are considering the distance and the vulnerability, so...
                                                                                                // Average Case: 1 + 1 + 1 + 1 = 4 or O(1), Worst Case: n + 1 + n + 1 = 2n + 2 or O(n)
      let temp = campus_map.gscore.get(current) + calculateEdge(current_node.x, current_node.y, next_node.x, next_node.y, 2) + campus_map.vertexInfo.get(adjacency).vulnerabilityLevel * vw; 
      // Only update the path to adjacent node only if it is shorter than previous paths.
      // If the current g-score is less than the adjacent node's g-score...
      if (temp < campus_map.gscore.get(adjacency)) {                                             // Average Case: 1 + 1 * m = 2m or O(m), Worst Case: n * m or O(n * m)
        // Current node will become the parent node of the adjacent node.
        campus_map.parent.set(adjacency, current);                                               // Average Case: 1 * m or O(m), Worst Case: n * m or O(n * m)
        // Compute g-score of adjacent node.
        campus_map.gscore.set(adjacency, temp);                                                  // Average Case: 1 * m or O(m), Worst Case: n * m or O(n * m)
        // Compute the h-score of adjacent node.
        campus_map.hscore.set(adjacency, heuristic(adjacency, destination, campus_map.vertexInfo));   // Average Case: (1 + 1) * m = 2m or O(m), Worst Case: (n + n) * m = 2n * m or O(n * m)

        let actual_cost = calculateEdge(next_node.x, next_node.y, destination_node.x, destination_node.y, 2) + campus_map.vertexInfo.get(adjacency).vulnerabilityLevel * vw;  
                                                                                                // Average Case: (1 + 1 + 1) * m = 3m or O(m), Worst Case: (1 + n + 1) * m = 2 + n * m or O(n * m)              
        let actual_cost_from_origin = campus_map.gscore.get(adjacency) + actual_cost;           // Average Case: (1 + 1) * m = 2m or O(m), Worst Case: (n + 1) * m = n * m or O(n * m)    

        // Check if heuristic is admissible.
        if (campus_map.hscore.get(adjacency) > actual_cost) {                                   // Average Case: 1 * m or O(m), Worst Case: n * m or O(n * m)
          console.log("Heuristic is not admissible!");                                          // 1 * m or O(m)
        }

        // Compute the f-score of adjacent node.
        campus_map.fscore.set(adjacency, campus_map.gscore.get(adjacency) + campus_map.hscore.get(adjacency));        // Average Case: (1 + 1 + 1) = 3 or O(1), Worst Case: (n + n + n) * m = 3n * m or O(n * m)

        if (campus_map.fscore.get(adjacency) > actual_cost_from_origin) {                       // Average Case: 1 * m or O(m), Worst Case: n * m or O(n * m)                                                                                        
          console.log("Heuristic is not admissible!");                                          // 1 * m or O(m)
        }

        // If the adjacent node of current node is not yet in the list of nodes to be explored...
        if (!toExplore.nodes.find((node) => node.node === adjacency)) {                         // n or O(n * m) -> Check if the adjacency is found in the nodes in the toExplore priority queue.                                                     
          // Add the adjacent node to list of nodes to explore.
          toExplore.enqueue(adjacency, campus_map.fscore.get(adjacency));                       // log n or O(m log n)
        }
      }
    });
  	}
	}
    
  return [];                                                                                                                                                                                  // 1 or O(1)
}

function heuristic(node, destination, vertexInfo) {																// Average Case: 9 or O(1) || Worst Case: 2n + 7 or O(n)
  const vw = 10;                                                                  // 1
  const dw = 1;                                                                   // 1

  let a = vertexInfo.get(node);                                                   // n (worst case), 1 (average case)
  let b = vertexInfo.get(destination);                                            // n (worst case), 1 (average case)

  var vulnerabilityLevel = a.vulnerabilityLevel;                                  // 1
  var distance = calculateEdge(a.x, a.y, b.x, b.y, 2);                            // Note calculateEdge function() = O(1)
  var heuristicCost = distance * dw + vulnerabilityLevel * vw;                    // 1 + 1

  return heuristicCost;                                                           // 1
}

function calculateEdge(ax, ay, bx, by, p) {																				// O(1) || 6
  const edge = Math.pow(Math.abs(ax - bx) ** p + Math.abs(ay - by) ** p, 1 / p);  // 1 + 1 + 1 + 1 + 1 = 5

	return edge;                                                                    // 1
}

class PriorityQueue {
  constructor() {
    this.nodes = [];                                                           // 1 or O(1) -> Initializes nodes as an instance variable as empty array
  }

  enqueue(node, priority) {                                                 // 1 + log(n) -> enqueues the node to its sorted position
		this.nodes.push([node, priority]);                                      // 1 or O(1) -> since push adds elements to the end of the array, so time complexity remains the same regardless of the size of the array
		this.maxHeapify();                                                      // log n -> heapify the new element (that is, continued swapping until heap property is satisfied)
	}
    
  dequeue() {                                                               // 1 + log n or O(log n) -> dequeues the node with the lowest f-score and returns it
  	if (this.isEmpty()) {                                                   // 1 or O(1) -> if array is empty
    return undefined;                                                     // 1 or O(1)
  	}

		if (this.nodes.length === 1) {                                          // 1 or O(1) -> if there is only one node left
      return this.nodes.pop()[0];                                           // 1 or O(1) -> simply pop (remove the element)
    }
      
    const minimum = this.nodes[0][0];                                       // 1 or O(1) -> Assign the minimum value (which should be the first element in the heap) to minimum 
    this.nodes[0] = this.nodes.pop();                                       // 1 or O(1) -> Assign the last element (that is popped from the heap) to the minimum's previous position
    this.minHeapify();                                                      // log n -> heapify the new element (that is, continued swapping until heap property is satisfied)
    return minimum;                                                         // 1 or O(1)
  }
        
  front() {                                                                 // 3 or O(1) -> Returns the front of the priority queue (the element with the minimum f-score)
    if (this.nodes[0]) {                                                    // 1 or O(1)
      return this.nodes[0][0];                                            // 1 or O(1) -> Return the first (minimum) element
    } else {
      return undefined;                                                   // 1 or O(1)
    }
  }
        
  size() {
    return this.nodes.length;                                               // 1 or O(1) -> Return the number of elements in the priority queue
  }
        
  isEmpty() {
    return this.nodes.length === 0;                                         // 1 or O(1) -> Check if the priority queue is empty
  }
        
  maxHeapify() {                                                            // 6 + log n or O(log n) -> Swaps the current node with parent until heap property is achieved (until it is sorted like a heap)
    let n = this.nodes.length - 1;                                          // 1 -> Assign the length of the priority queue to n
    while (n > 0) {                                                         // log n -> For every iteration in this binary heap, n is divided by half approximately.
			const p = Math.floor((n - 1) / 2);                                    // 1 -> Assigns the parent index to half of the priority queue's length. 
			if (this.nodes[n][1] < this.nodes[p][1]) {                            // 1 -> If the f-score of current node is less than the f-score of the parent node (which is in the middle of the array),
				this.swap(n, p);                                                    // 1 -> their indexes must be swapped. To maintain the heap property, the value of the parent node should always be greater than its children.
				n = p;                                                              // 1 -> Once swapped, the current node will have p's index and the parent node will have the current node's index.
			} else {
				break;                                                              // 1 -> End the loop if current node is indeed less than parent node because the heap property has already been satisfied.
			}
  	}
	}
        
  minHeapify() {                                                            // 16 + log n or O(log n)
    let i = 0;                                                              // 1
    const n = this.nodes.length;                                            // 1
    const node = this.nodes[0];                                             // 1
        
    while (true) {                                                          // log n -> For every iteration in this binary heap, n is divided by half approximately.
      let leftChild, rightChild;                                            // 1
      let temp = null;                                                      // 1
      let leftChildIndex = i * 2 + 1;                                       // 1 -> Get the index of the left child 
      let rightChildIndex = i * 2 + 2;                                      // 1 -> Get the index of the right child                            
            
      if (leftChildIndex < n) {                                             // 1 -> If index is less than the length of the priority queue
        leftChild = this.nodes[leftChildIndex];                             // 1 -> Assign the f-score of the left child to the variable of the same name
        if (leftChild[1] < node[1]) {                                       // 1 -> If the f-score of the left child is less than the f-score of the root node
          temp = leftChildIndex;                                            // 1 -> Store the left child index into a temporary variable for swapping
        }
      }
        
  	  if (rightChildIndex < n) {                                            // 1 -> If index is less than the length of the priority queue
        rightChild = this.nodes[rightChildIndex];                           // 1 -> Assign the f-score of the right child to the variable of the same name
        if ((temp === null && rightChild[1] < node[1]) || (temp !== null && rightChild[1] < leftChild[1])) {
          // 1 -> If there is no f-score stored in the temporary variable and the right child is greater than the f-score of the root node
  	      // 1 -> OR if there is f-score stored in the temporary variable and the f-score of the right child is less than the f-score of the left child
  	      // 1 -> The temporary variable is assigned the index of the right child
          temp = rightChildIndex;
        }
      }
        
      if (temp === null) {                                                  // 1 -> If there is no temporary variable, end the loop.
        break;                                                              // 1 -> If there is no temporary variable, end the loop.
      }
        
      this.swap(i, temp);                                                   // 1 -> Else, the index of the temporary variable will be swapped with the index of the root.
      i = temp;
    }
  }
        
		swap(i, j) {
		[this.nodes[i], this.nodes[j]] = [this.nodes[j], this.nodes[i]];        // 1 -> Swaps the f-scores in specified indices.
  }
}

function drawPath(campus_map, node) {                                                 // Average Case: 8 + 9m or O(m), Worst Case: 7 + n * 9m or O(n * m)
  let path = [];                                                                      // 1 or O(1)
  while (node) {                                                                      // m or O(m) (assuming that the path from the current node to origin node is an array of size m)
    const nodeInfo = campus_map.vertexInfo.get(node);                                 // 1 * m or O(m) -> Average Case, n -> Worst Case
    if (!nodeInfo) {                                                                  // 1 * m or O(m) 
      console.error(`No vertex info found for node ID: ${node}`);                     // 1 * m or O(m) 
      break;                                                                          // 1 * m or O(m) 
    }

    const { latitude, longitude } = nodeInfo;                                         // 1 * m or O(m) -> Extract latitude and longitude correctly
    path.push([latitude, longitude]);                                                 // 1 * m or O(m) -> Push the latitude and longitude as an array
    node = campus_map.parent.get(node);                                               // 1 * m or O(m) -> Average Case, n * m or O(n * m) -> Worst Case
  }

  return path.reverse();                                                              // m or O(m) -> Reverse the path to start from the origin
}