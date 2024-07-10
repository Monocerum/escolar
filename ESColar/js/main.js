document.addEventListener("DOMContentLoaded", () => {
  // Leaflet
  // Define northeast and southwest lat and long to limit viewable areag
  var ne = L.latLng(14.599792, 121.01532);
  var sw = L.latLng(14.5958, 121.0082);
  var bounds = L.latLngBounds(ne, sw);

  // Initialize map, set view, zoom level, max bounds (maximum viewable area)
  var map = L.map("map", {
    center: [14.59785, 121.01098],
    minZoom: 18,
    zoom: 19,
    maxBounds: bounds,
    zoomControl: false,
  });

  // Set max zoom level
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 22,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  // Not included in actual application, defines popup from popup method in Leaflet
  var popup = L.popup();

  // Defines mapWidth and mapHeight by dynamically getting the width and height of the map
  const mapWidth = document.getElementById("map").offsetWidth;
  const mapHeight = document.getElementById("map").offsetHeight;

  // Graph Data Structure, class that contains main functions for the development of the graph
  class Campus {
    // Passes the number of node as a parameter to the constructor method
    constructor(nodeNum) {
      // Parameter is assigned to this constructors' id
      this.id = nodeNum;
      // Creates new map object as adjacency list (list of neighbors)
      this.adjacent = new Map();
      // Creates new map object for vertex information
      this.vertexInfo = new Map();
      // g(n) - actual cost from start to current node
      this.gscore = new Map();
      // h(n) - heuristic cost from current node to goal node
      this.hscore = new Map();
      // f(n) = g(n) + h(n)
      this.fscore = new Map();
      // parent node
      this.parent = new Map();
    }

    // Adds vertex to graph data structure
    addVertex(id, latitude, longitude, x, y, vulnerabilityLevel) {
      // Adds a key-value pair in the map; id serves as the key, and [] (empty array) serves as the value
      this.adjacent.set(id, []);
      // Sets the id, latitude, longitude, x, and y of specific vertex
      this.vertexInfo.set(id, {
        id: id,
        latitude: latitude,
        longitude: longitude,
        x: x,
        y: y,
        vulnerabilityLevel: vulnerabilityLevel,
      });
      this.gscore.set(id, Infinity);
      this.hscore.set(id, 0);
      this.fscore.set(id, Infinity);
      this.parent.set(id, null);
    }

    // Adds edge between node a and node b
    addEdge(a, b, edge_cost) {
      this.adjacent.get(a).push({ node: b, edge_cost: edge_cost });
      this.adjacent.get(b).push({ node: a, edge_cost: edge_cost });
    }
  }

  // Convert latitude and longitude to x and y; See: https://stackoverflow.com/questions/2103924/mercator-longitude-and-latitude-calculations-to-x-and-y-on-a-cropped-map-of-the
  function convertGeo(latitude, longitude, width, height, leftLong, rightLong, latBottom) {
    const radLatBottom = latBottom * (Math.PI / 180);
    const radLat = latitude * (Math.PI / 180);
    const long = rightLong - leftLong;
    const mapWidth = ((width / long) * 360) / (2 * Math.PI);
    const offsetY = (mapWidth / 2) * Math.log((1 + Math.sin(radLatBottom)) / (1 - Math.sin(radLatBottom)));

    const x = (longitude - leftLong) * (width / long);
    const y = height - ((mapWidth / 2) * Math.log((1 + Math.sin(radLat)) / (1 - Math.sin(radLat))) - offsetY);

    return { x, y };
  }

  // Function to calculate the edges of each node using node a's x and y, and node b's x and y, as well as the order (p)
  // Uses Minkowski's Distance Formula
  function calculateEdge(ax, ay, bx, by, p) {
    const edge = Math.pow(Math.abs(ax - bx) ** p + Math.abs(ay - by) ** p, 1 / p);

    return edge;
  }

  class PriorityQueue {
    constructor() {
      this.nodes = [];                                                        // 1 or O(1) -> Initializes nodes as an instance variable as empty array
    }

    enqueue(node, priority) {                                                 // 1 + log(n) -> enqueues the node to its sorted position
      this.nodes.push([node, priority]);                                      // 1 or O(1) -> since push adds elements to the end of the array, so time complexity rmeains the same regardless of the size of the array
      this.maxHeapify();                                                      // log n -> heapify the new element (that is, continued swapping until max heap property is satisfied)
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
      this.minHeapify();                                                      // log n -> heapify the new element (that is, continued swapping until min heap property is satisfied)
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
        if (this.nodes[n][1] < this.nodes[p][1]) {                            // 1 -> Recall that in the first half contains the lower values and the second half contains the higher values. Hence, if we want to maintain the heap property, the loop runs until the index is less than the calculated parent index.
          this.swap(n, p);                                                    // 1 -> If the current node's f-score is less than the parent node, then swap the indexes. To maintain the heap property, the value of the parent node should be greater than its children.
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
        let rightChildIndex = i * 2 + 2;                                      // 1 -> Get the index of the right child                                         // -> Decla
        
  
        if (leftChildIndex < n) {                                             // 1 -> If index is less than the length of the priority queue
          leftChild = this.nodes[leftChildIndex];                             // 1 -> Assign the f-score of the left child to the variable of the same name
          if (leftChild[1] < node[1]) {                                       // 1 -> If the f-score of the left child is less than the f-score of the root node
            temp = leftChildIndex;                                            // 1 -> Store the left child index into a temporary variable for swapping
          }
        }
    
        if (rightChildIndex < n) {                                            // 1 -> If index is less than the length of the priority queue
          rightChild = this.nodes[rightChildIndex];                           // 1 -> Assign the f-score of the right child to the variable of the same name
          if ((temp === null && rightChild[1] < node[1]) || (temp !== null && rightChild[1] < leftChild[1])) {
              // 1 * log n -> If there is no f-score stored in the temporary variable and the right child is greater than the f-score of the root node
              // 1 * log n -> OR if there is f-score stored in the temporary variable and the f-score of the right child is less than the f-score of the left child
              // 1 * log n -> The temporary variable is assigned the index of the right child
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

// Heuristic function (h(n))
function heuristic(node, destination, vertexInfo) {
  const vw = 10;
  const dw = 1;

  let a = vertexInfo.get(node);
  let b = vertexInfo.get(destination);

  var vulnerabilityLevel = a.vulnerabilityLevel;
  var distance = calculateEdge(a.x, a.y, b.x, b.y, 2);
  var heuristicCost = distance * dw + vulnerabilityLevel * vw;

  return heuristicCost;
}

  // A* Search Algorithm
function aStarSearch(campus_map, origin, destination) {
  const penalty = 100;                                                        // Adds 'penalty' to nodes that are included in the generated path to make them less desirable

  // Function to find a path with optional penalties for certain nodes
  function findPath(avoidNodes = new Set()) {                                 // findPath() function finds path and takes in a parameter of avoidNodes, which is the set of nodes that have already been generated in previous path
    var toExplore = new PriorityQueue();                                      // Initialization of new PriorityQueue()
    var explored = new Set();                                                 // Initalization of new Set()

    for (let id of campus_map.vertexInfo.keys()) {                            // Iterate through all nodes in campus_map and re-initialize/initialize the values of g-score, f-score, h-score, and parent
      campus_map.gscore.set(id, Infinity);                                    // Initializes g-score as infinity
      campus_map.fscore.set(id, Infinity);                                    // Initializes f-score as infinity
      campus_map.hscore.set(id, 0);                                           // Initializes h-score as 0
      campus_map.parent.set(id, Infinity);                                    // Initializes parent node as Infinity
    }

    const vw = 10;                                                            // Variable assignment

    campus_map.gscore.set(origin, 0);                                                               // Initialize/Set the g-score of the origin node to 0
    campus_map.hscore.set(origin, heuristic(origin, destination, campus_map.vertexInfo));           // Initialize/Set the h-score of the origin node using the heuristic function
    campus_map.fscore.set(origin, campus_map.gscore.get(origin) + campus_map.hscore.get(origin));   // Initialize/Set the f-score of the origin node to the sum of its g-score and h-score

    toExplore.enqueue(origin, campus_map.fscore.get(origin));                 // Enqueue the f-score of the origin node to the toExplore priority queue.

    while (!toExplore.isEmpty()) {                                            // Evaluate if the toExplore priority queue is not empty.
      let current = toExplore.dequeue();                                      // If it is not empty, the first element in the queue is dequeued and is then assigned as the current node.

      if (current === destination) {                                          // If the current node is the destination node, it means that the algorithm has reached its destination.
        return drawPath(campus_map, current);                                 // The drawPath() function will then be executed.
      }

      explored.add(current);                                                  // If the current node is not the destination node, it means that we should continue with our exploration. The current node is added to the explored set.

      let adjacencyList = campus_map.adjacent.get(current);                   // Assign the list of adjacent nodes to the adjacencyList.

      if (!adjacencyList) {                                                   // If there is no adjacency list (or if there are no adjacent nodes for the current node)
        console.log("No adjacency list found for node:", current);          
        continue;                                                             // Continue to the next iteration as there is no adjacent nodes to explore for the current node.
      }

      adjacencyList.forEach(({ node: adjacency }) => {
        if (explored.has(adjacency) || campus_map.vertexInfo.get(adjacency).vulnerabilityLevel === 3) {
          return;
        }

        let current_node = campus_map.vertexInfo.get(current);
        let next_node = campus_map.vertexInfo.get(adjacency);
        let destination_node = campus_map.vertexInfo.get(destination);

        let temp = campus_map.gscore.get(current) + calculateEdge(current_node.x, current_node.y, next_node.x, next_node.y, 2) + campus_map.vertexInfo.get(adjacency).vulnerabilityLevel * vw;

        // Apply penalty if the node is part of the penalty nodes
        if (avoidNodes.has(adjacency)) {
          temp += penalty;
        }

        if (temp < campus_map.gscore.get(adjacency)) {
          campus_map.parent.set(adjacency, current);
          campus_map.gscore.set(adjacency, temp);
          campus_map.hscore.set(adjacency, heuristic(adjacency, destination, campus_map.vertexInfo));

          let actual_cost = calculateEdge(next_node.x, next_node.y, destination_node.x, destination_node.y, 2) + campus_map.vertexInfo.get(adjacency).vulnerabilityLevel * vw;
          let actual_cost_from_origin = campus_map.gscore.get(adjacency) + actual_cost;

          if (campus_map.hscore.get(adjacency) > actual_cost) {
            console.log("Heuristic is not admissible!");
          }

          campus_map.fscore.set(adjacency, campus_map.gscore.get(adjacency) + campus_map.hscore.get(adjacency));

          if (campus_map.fscore.get(adjacency) > actual_cost_from_origin) {
            console.log("Heuristic is not admissible!");
          }

          if (!toExplore.nodes.find((node) => node.node === adjacency)) {
            toExplore.enqueue(adjacency, campus_map.fscore.get(adjacency));
          }
        }
      });
  }

  return null;
  }

  // Find the shortest path using the A* Search Algorithm (findPath() function)
  let shortestPath = findPath();

  if (!shortestPath) {
    console.error("No path found.");
    return { shortestPath: [], alternativePath: [] };
  }

  // The id of each node is found using latitude and longitude (coordinates) of each node in the shortest path
  let shortestPathNodes = new Set(shortestPath.map(([lat, lon]) => getNodeIdFromCoordinates(lat, lon, campus_map.vertexInfo)));

  // It is necessary to re-initialize the g-score, h-score, f-score, and parent so that there will be no conflict with the values for the alternative path
  campus_map.gscore = new Map();
  campus_map.hscore = new Map();
  campus_map.fscore = new Map();
  campus_map.parent = new Map();

  // Find the next optimal path using the A* Search Algorithm (findPath() function)
  let alternativePath = findPath(shortestPathNodes);

  return {
    shortestPath,
    alternativePath
  };
}

  function drawPath(campus_map, node) {
    let path = [];
    while (node) {
      const nodeInfo = campus_map.vertexInfo.get(node);
      if (!nodeInfo) {
        console.error(`No vertex info found for node ID: ${node}`);
        break;
      }

      const { latitude, longitude } = nodeInfo;
      path.push([latitude, longitude]);
      node = campus_map.parent.get(node);
    }
    return path.reverse(); // Reverse the path to start from the origin
  }

  // Initializes left longitude, right longitude, bottom latitude
  const leftLong = 121.0082;
  const rightLong = 121.01532;
  const latBottom = 14.5958;

  // Initializes new campus_map using the Campus() class
  var campus_map = new Campus(186);

  // Vertices
  // Vertices
  var vertices = [
    {
      id: "Oval",
      class: "dn",
      name: "Oval",
      latitude: 14.598115,
      longitude: 121.012039,
      vulnerabilityLevel: 1,
    }, // Buildings / Areas
    {
      id: "Grandstand",
      class: "bn",
      name: "Grandstand",
      latitude: 14.598021,
      longitude: 121.011524,
      vulnerabilityLevel: 1.67,
    },
    {
      id: "CommunityBuilding",
      class: "bn",
      name: "Community Building",
      latitude: 14.598094,
      longitude: 121.012484,
      vulnerabilityLevel: 1.67,
    },
    {
      id: "InfoCenter",
      class: "bn",
      name: "Information Center",
      latitude: 14.599077,
      longitude: 121.011583,
      vulnerabilityLevel: 1.33,
    },
    {
      id: "BCourt",
      class: "bn",
      name: "Court",
      latitude: 14.598635,
      longitude: 121.010821,
      vulnerabilityLevel: 1,
    },
    {
      id: "B1",
      class: "bn",
      name: "Building 1",
      latitude: 14.599585,
      longitude: 121.01107,
      vulnerabilityLevel: 1,
    },
    {
      id: "Gymnasium",
      class: "bn",
      name: "PUP Gymnasium",
      latitude: 14.599237,
      longitude: 121.010743,
      vulnerabilityLevel: 1.33,
    },
    {
      id: "Pool",
      class: "bn",
      name: "Swimming Pool Area",
      latitude: 14.5989,
      longitude: 121.010211,
      vulnerabilityLevel: 1.67,
    },
    {
      id: "Souvenir",
      class: "bn",
      name: "PUP Souvenir Shop",
      latitude: 14.598428,
      longitude: 121.011235,
      vulnerabilityLevel: 1,
    },
    {
      id: "AMShrine",
      class: "bn",
      name: "Apolinario Mabini Shrine",
      latitude: 14.598195,
      longitude: 121.011151,
      vulnerabilityLevel: 1.67,
    },
    {
      id: "AMMuseum",
      class: "bn",
      name: "Apolinario Mabini Museum",
      latitude: 14.597905,
      longitude: 121.01122,
      vulnerabilityLevel: 1.67,
    },
    {
      id: "PE",
      class: "bn",
      name: "PE Building",
      latitude: 14.598451,
      longitude: 121.010134,
      vulnerabilityLevel: 1.67,
    },
    {
      id: "TahananAlumni",
      class: "bn",
      name: "Tahanan ng Alumni",
      latitude: 14.598507,
      longitude: 121.010171,
      vulnerabilityLevel: 2,
    },
    {
      id: "B2",
      class: "bn",
      name: "Building 2",
      latitude: 14.598326,
      longitude: 121.009626,
      vulnerabilityLevel: 1.67,
    },
    {
      id: "MT",
      class: "bn",
      name: "Millenium Tower",
      latitude: 14.597809,
      longitude: 121.009356,
      vulnerabilityLevel: 1.67,
    },
    {
      id: "LaboratoryHS",
      class: "bn",
      name: "PUP Laboratory High School",
      latitude: 14.597237,
      longitude: 121.009122,
      vulnerabilityLevel: 2,
    },
    {
      id: "PBMO",
      class: "bn",
      name: "Property Building and Motorpool Office",
      latitude: 14.597385,
      longitude: 121.00857,
      vulnerabilityLevel: 1.67,
    },
    {
      id: "PO",
      class: "bn",
      name: "Printing Office",
      latitude: 14.597303,
      longitude: 121.008731,
      vulnevulnerabilityLevelrability: 1.67,
    },
    {
      id: "SB",
      class: "bn",
      name: "Sampaguita Building",
      latitude: 14.596827,
      longitude: 121.009862,
      vulnerabilityLevel: 1.67,
    },
    {
      id: "PS",
      class: "bn",
      name: "PUP Pumping Station",
      latitude: 14.596573,
      longitude: 121.010136,
      vulnerability: 1.67,
    },
    {
      id: "NALRC",
      class: "bn",
      name: "Ninoy Aquino Learning Resource Center",
      latitude: 14.597884,
      longitude: 121.009761,
      vulnerabilityLevel: 2.33,
    },
    {
      id: "PK",
      class: "bn",
      name: "PUP Kasarianlan",
      latitude: 14.597123,
      longitude: 121.009754,
      vulnerabilityLevel: 2,
    },
    {
      id: "SC",
      class: "bn",
      name: "Student Canteen",
      latitude: 14.596962,
      longitude: 121.009806,
      vulnerabilityLevel: 2,
    },
    {
      id: "MBMD",
      class: "bn",
      name: "Main Building Main Dome",
      latitude: 14.596993,
      longitude: 121.010778,
      vulnerabilityLevel: 2.67,
    },
    {
      id: "MBWW",
      class: "bn",
      name: "Main Building West Wing",
      latitude: 14.596908,
      longitude: 121.010397,
      vulnerabilityLevel: 2.67,
    },
    {
      id: "MBEW",
      class: "bn",
      name: "Main Building East Wing",
      latitude: 14.596726,
      longitude: 121.011082,
      vulnerabilityLevel: 2.67,
    },
    {
      id: "MBNW",
      class: "bn",
      name: "Main Building North Wing",
      latitude: 14.597362,
      longitude: 121.010881,
      vulnerabilityLevel: 2.67,
    },
    {
      id: "MBSW",
      class: "bn",
      name: "Main Building South Wing",
      latitude: 14.596545,
      longitude: 121.010663,
      vulnerabilityLevel: 2.67,
    },
    {
      id: "CH",
      class: "bn",
      name: "Interfaith Ecumenical Chapel",
      latitude: 14.597136,
      longitude: 121.011442,
      vulnerabilityLevel: 2,
    }, // Intersection around PUP Chapel, near East Wing
    {
      id: "NFSB",
      class: "bn",
      name: "Nutrition and Food Science Building",
      latitude: 14.596877,
      longitude: 121.011693,
      vulnerabilityLevel: 1.67,
    },
    {
      id: "CDM",
      class: "bn",
      name: "Campus Development and Maintenance",
      latitude: 14.596368,
      longitude: 121.011199,
      vulnerabilityLevel: 1.67,
    },

    // Exits
    {
      id: "OvalE1",
      class: "en",
      name: "Oval Exit/Entrance 1",
      latitude: 14.598949,
      longitude: 121.011719,
      vulnerabilityLevel: 1,
    },
    {
      id: "OvalE2",
      class: "en",
      name: "Oval Exit/Entrance 2",
      latitude: 14.597432,
      longitude: 121.011698,
      vulnerabilityLevel: 1,
    },
    {
      id: "B1E",
      class: "en",
      name: "B1 Exit",
      latitude: 14.599458,
      longitude: 121.011202,
      vulnerabilityLevel: 1.67,
    },
    {
      id: "GE1",
      class: "en",
      name: "Gymnasium Exit 1",
      latitude: 14.599438,
      longitude: 121.010976,
      vulnerabilityLevel: 1.67,
    },
    {
      id: "GE2",
      class: "en",
      name: "Gymnasium Exit 2",
      latitude: 14.599181,
      longitude: 121.010991,
      vulnerabilityLevel: 1.67,
    },
    {
      id: "GE3",
      class: "en",
      name: "Gymnasium Exit 3",
      latitude: 14.598992,
      longitude: 121.010778,
      vulnerabilityLevel: 1.67,
    },
    {
      id: "AMSE",
      class: "en",
      name: "Shrine Exit",
      latitude: 14.598091,
      longitude: 121.01112,
      vulnerabilityLevel: 1.67,
    },
    {
      id: "AMME",
      class: "en",
      name: "Museum Exit",
      latitude: 14.597875,
      longitude: 121.01118,
      vulnerabilityLevel: 1.67,
    },
    {
      id: "AME",
      class: "en",
      name: "Apolinario Mabini Museum Exit",
      latitude: 14.597942,
      longitude: 121.011037,
      vulnerabilityLevel: 2,
    },
    {
      id: "SE",
      class: "en",
      name: "Swimming Pool Exit",
      latitude: 14.598515,
      longitude: 121.0102777,
      vulnerabilityLevel: 2,
    },

    {
      id: "LAGE1",
      class: "en",
      name: "Lagoon Exit 1",
      latitude: 14.597946,
      longitude: 121.010655,
      vulnerabilityLevel: 1.5,
    },
    {
      id: "LAGE2",
      class: "en",
      name: "Lagoon Exit 2",
      latitude: 14.597332,
      longitude: 121.010008,
      vulnerabilityLevel: 1.5,
    },

    {
      id: "NALRCE",
      class: "en",
      name: "Ninoy Aquino Learning Resource Center Exit",
      latitude: 14.597726,
      longitude: 121.009692,
      vulnerabilityLevel: 2.33,
    },

    {
      id: "PKE",
      class: "en",
      name: "PUP Kasarianlan Exit",
      latitude: 14.597168,
      longitude: 121.009878,
      vulnerabilityLevel: 2,
    },
    {
      id: "SCE",
      class: "en",
      name: "Student Canteen Exit",
      latitude: 14.59699,
      longitude: 121.009926,
      vulnerabilityLevel: 2,
    },
    {
      id: "PKE",
      class: "en",
      name: "PUP Kasarianlan Exit",
      latitude: 14.597168,
      longitude: 121.009878,
      vulnerabilityLevel: 2,
    },

    {
      id: "LHSE1",
      class: "en",
      name: "Laboratory High School Exit 1",
      latitude: 14.597524,
      longitude: 121.008955,
      vulnerabilityLevel: 2,
    },
    {
      id: "LHSE2",
      class: "en",
      name: "Laboratory High School Exit 2",
      latitude: 14.597394,
      longitude: 121.009122,
      vulnerabilityLevel: 2,
    },
    {
      id: "LHSE3",
      class: "en",
      name: "Laboratory High School Exit 3",
      latitude: 14.597344,
      longitude: 121.009164,
      vulnerabilityLevel: 2,
    },
    {
      id: "LHSE4",
      class: "en",
      name: "Laboratory High School Exit 4",
      latitude: 14.59738,
      longitude: 121.009305,
      vulnerabilityLevel: 2,
    },
    {
      id: "LHSE5",
      class: "en",
      name: "Laboratory High School Exit 5",
      latitude: 14.597173,
      longitude: 121.009289,
      vulnerabilityLevel: 2,
    },

    {
      id: "MDE1",
      class: "en",
      name: "Main Dome Exit 1",
      latitude: 14.597148,
      longitude: 121.010641,
      vulnerabilityLevel: 2.67,
    },
    {
      id: "MDE2",
      class: "en",
      name: "Main Dome Exit 2",
      latitude: 14.597024,
      longitude: 121.010981,
      vulnerabilityLevel: 2.67,
    },

    {
      id: "EWE1",
      class: "en",
      name: "East Wing Exit 1",
      latitude: 14.596522,
      longitude: 121.011301,
      vulnerabilityLevel: 2.67,
    }, // Exit from MDI7
    {
      id: "EWE2",
      class: "en",
      name: "East Wing Exit 2",
      latitude: 14.596469,
      longitude: 121.01119,
      vulnerabilityLevel: 2.67,
    },
    {
      id: "EWE3",
      class: "en",
      name: "East Wing Exit 3",
      latitude: 14.596622,
      longitude: 121.011352,
      vulnerabilityLevel: 2.67,
    },

    {
      id: "SWE1",
      class: "en",
      name: "South Wing Exit 1",
      latitude: 14.596476,
      longitude: 121.01038,
      vulnerabilityLevel: 2.67,
    },
    {
      id: "SWE2",
      class: "en",
      name: "South Wing Exit 2",
      latitude: 14.596351,
      longitude: 121.010872,
      vulnerabilityLevel: 2.67,
    },

    {
      id: "WWE1",
      class: "en",
      name: "West Wing Exit 1",
      latitude: 14.596827,
      longitude: 121.0101,
      vulnerabilityLevel: 2.67,
    },
    {
      id: "WWE2",
      class: "en",
      name: "West Wing Exit 2",
      latitude: 14.596936,
      longitude: 121.010114,
      vulnerabilityLevel: 2.67,
    },
    {
      id: "WWE3",
      class: "en",
      name: "West Wing Exit 3",
      latitude: 14.596734,
      longitude: 121.010175,
      vulnerabilityLevel: 2.67,
    },

    {
      id: "NWE1",
      class: "en",
      name: "North Wing Exit 1",
      latitude: 14.597659,
      longitude: 121.010951,
      vulnerabilityLevel: 3,
    },
    {
      id: "NWE2",
      class: "en",
      name: "North Wing Exit 2",
      latitude: 14.597658,
      longitude: 121.010845,
      vulnerabilityLevel: 3,
    },
    {
      id: "NWE3",
      class: "en",
      name: "North Wing Exit 3",
      latitude: 14.597618,
      longitude: 121.011047,
      vulnerabilityLevel: 3,
    },

    // Gates
    {
      id: "MainGate",
      class: "gn",
      name: "Main Gate",
      latitude: 14.599127,
      longitude: 121.011823,
      vulnerabilityLevel: 1.5,
    },
    {
      id: "Gate2",
      class: "gn",
      name: "Gate 2",
      latitude: 14.5995,
      longitude: 121.011406,
      vulnerabilityLevel: 1.5,
    },

    // Paths / Intersections
    {
      id: "I1",
      class: "in",
      name: "Intersection 1",
      latitude: 14.598854,
      longitude: 121.011538,
      vulnerabilityLevel: 1,
    }, // Intersection to Gym and main path, near entrance
    {
      id: "I2",
      class: "in",
      name: "Intersection 2",
      latitude: 14.598218,
      longitude: 121.011368,
      vulnerabilityLevel: 1,
    }, // Intersection to PUP Chapel
    {
      id: "I3",
      class: "in",
      name: "Intersection 3",
      latitude: 14.59786,
      longitude: 121.011368,
      vulnerabilityLevel: 1,
    }, // Intersection to PUP Chapel
    {
      id: "I4",
      class: "in",
      name: "Intersection 4",
      latitude: 14.59767782936394,
      longitude: 121.01116787642243,
      vulnerabilityLevel: 1,
    },
    {
      id: "I5",
      class: "in",
      name: "Intersection 5",
      latitude: 14.597780681006713,
      longitude: 121.01137440651657,
      vulnerabilityLevel: 1,
    },
    // Main Building: North Wing (Under Construction)
    {
      id: "NWI1",
      name: "North Wing Intersection 1",
      latitude: 14.597159,
      longitude: 121.010624,
      vulnerabilityLevel: 2,
    }, // Intersection around Lagoon
    {
      id: "NWI2",
      name: "North Wing Intersection 2",
      latitude: 14.597694,
      longitude: 121.010789,
      vulnerabilityLevel: 2,
    }, // Intersection around Lagoon
    {
      id: "NWI2",
      name: "North Wing Intersection 2",
      latitude: 14.597694,
      longitude: 121.010789,
      vulnerabilityLevel: 2,
    },

    // To Main Building
    {
      id: "TMBI1",
      name: "Intersection to Main Building 1",
      latitude: 14.597119,
      longitude: 121.010298,
      vulnerabilityLevel: 1.5,
    }, // Intersection near Auditorium from I25
    {
      id: "TMBI2",
      name: "Intersection to Main Building 2",
      latitude: 14.597074,
      longitude: 121.010397,
      vulnerabilityLevel: 1.5,
    }, // Intersection near Auditorium from I24
    {
      id: "TMBI3",
      name: "Intersection to Main Building 3",
      latitude: 14.597243,
      longitude: 121.010119,
      vulnerabilityLevel: 1.5,
    }, // Intersection near Auditorium

    // Chapel
    {
      id: "CHI1",
      name: "Chapel Intersection 1",
      latitude: 14.597427,
      longitude: 121.011589,
      vulnerabilityLevel: 1,
    }, // Intersection to PUP Chapel
    {
      id: "CHI2",
      name: "Chapel Intersection 2",
      latitude: 14.597342,
      longitude: 121.011693,
      vulnerabilityLevel: 1,
    }, // Intersection around PUP Chapel
    {
      id: "CHI3",
      name: "Chapel Intersection 3",
      latitude: 14.597206,
      longitude: 121.011758,
      vulnerabilityLevel: 1,
    }, // Intersection around PUP Chapel
    {
      id: "CHI4",
      name: "Chapel Intersection 4",
      latitude: 14.59698,
      longitude: 121.011718,
      vulnerabilityLevel: 1,
    }, // Intersection around PUP Chapel
    {
      id: "CHI5",
      name: "Chapel Intersection 5",
      latitude: 14.59684,
      longitude: 121.011536,
      vulnerabilityLevel: 1,
    }, // Intersection around PUP Chapel
    {
      id: "CHI6",
      name: "Chapel Intersection 6",
      latitude: 14.596846,
      longitude: 121.011302,
      vulnerabilityLevel: 1.5,
    }, // Intersection around PUP Chapel, to around East Wing
    {
      id: "CHI7",
      name: "Chapel Intersection 7",
      latitude: 14.597053,
      longitude: 121.011109,
      vulnerabilityLevel: 1.5,
    }, // Intersection around PUP Chapel, near Main Dome
    {
      id: "CHI8",
      name: "Chapel Intersection 8",
      latitude: 14.597316,
      longitude: 121.011151,
      vulnerabilityLevel: 1.5,
    }, // Intersection around PUP Chapel, near North Wing
    {
      id: "CHI9",
      name: "Chapel Intersection 9",
      latitude: 14.59745,
      longitude: 121.011341,
      vulnerabilityLevel: 1.5,
    }, // Intersection around PUP Chapel, near Main Dome
    {
      id: "CHI10",
      name: "Chapel Intersection 10",
      latitude: 14.596739,
      longitude: 121.011408,
      vulnerabilityLevel: 1.5,
    }, // Intersection around PUP Chapel, near East Wing

    // Main Building: Main Dome
    {
      id: "MDI1",
      class: "min",
      name: "Main Dome Intersection 1",
      latitude: 14.59689,
      longitude: 121.010749,
      vulnerabilityLevel: 2.67,
    },
    {
      id: "MDI2",
      class: "min",
      name: "Main Dome Intersection 2",
      latitude: 14.596982,
      longitude: 121.01068,
      vulnerabilityLevel: 2.67,
    },
    {
      id: "MDI3",
      class: "min",
      name: "Main Dome Intersection 3",
      latitude: 14.597081,
      longitude: 121.010709,
      vulnerabilityLevel: 2.67,
    }, // Intersection to NWI1
    {
      id: "MDI4",
      class: "min",
      name: "Main Dome Intersection 4",
      latitude: 14.597112,
      longitude: 121.010809,
      vulnerabilityLevel: 2.67,
    },
    {
      id: "MDI5",
      class: "min",
      name: "Main Dome Intersection 5",
      latitude: 14.597001,
      longitude: 121.010895,
      vulnerabilityLevel: 2.67,
    }, // Intersection to CHI7
    {
      id: "MDI6",
      class: "min",
      name: "Main Dome Intersection 6",
      latitude: 14.596934,
      longitude: 121.010868,
      vulnerabilityLevel: 2.67,
    },

    // Main Building: East Wing
    {
      id: "EWI1",
      name: "East Wing Intersection 1",
      latitude: 14.596641,
      longitude: 121.011419,
      vulnerabilityLevel: 2.67,
    }, // Intersection near East Wing
    {
      id: "EWI2",
      name: "East Wing Intersection 2",
      latitude: 14.596572,
      longitude: 121.011379,
      vulnerabilityLevel: 2.67,
    }, // Intersection near East Wing

    // Main Building: South Wing
    {
      id: "SWI1",
      name: "South Wing Intersection 1",
      latitude: 14.596248,
      longitude: 121.011029,
      vulnerabilityLevel: 2.67,
    }, // Intersection between South and East Wing
    {
      id: "SWI2",
      name: "South Wing Intersection 2",
      latitude: 14.596443,
      longitude: 121.010309,
      vulnerabilityLevel: 2.67,
    }, // Intersection southwest corner of South Wing
    {
      id: "SWI3",
      name: "South Wing Intersection 3",
      latitude: 14.596589,
      longitude: 121.010247,
      vulnerabilityLevel: 2.67,
    }, // Intersection between South and West Wing
    {
      id: "SWI4",
      class: "min",
      name: "South Wing Intersection 4",
      latitude: 14.596523,
      longitude: 121.010396,
      vulnerabilityLevel: 2.67,
    },
    {
      id: "SWI5",
      class: "min",
      name: "South Wing Intersection 5",
      latitude: 14.59669,
      longitude: 121.01044,
      vulnerabilityLevel: 2.67,
    },
    {
      id: "SWI6",
      class: "min",
      name: "South Wing Intersection 6",
      latitude: 14.596565,
      longitude: 121.01093,
      vulnerabilityLevel: 2.67,
    },
    {
      id: "SWI7",
      class: "min",
      name: "South Wing Intersection 7",
      latitude: 14.596402,
      longitude: 121.010888,
      vulnerabilityLevel: 2.67,
    },
    {
      id: "SWI8",
      class: "min",
      name: "South Wing Intersection 8",
      latitude: 14.596633,
      longitude: 121.010689,
      vulnerabilityLevel: 2.67,
    },
    {
      id: "SWI9",
      class: "min",
      name: "South Wing Intersection 9",
      latitude: 14.596465,
      longitude: 121.010644,
      vulnerabilityLevel: 2.67,
    },

    // Main Building: West Wing
    {
      id: "WWI1",
      name: "West Wing Intersection 1",
      latitude: 14.59677,
      longitude: 121.010064,
      vulnerabilityLevel: 2.67,
    }, // Intersection near West Wing
    {
      id: "WWI2",
      name: "West Wing Intersection 2",
      latitude: 14.596958,
      longitude: 121.010001,
      vulnerabilityLevel: 2.67,
    }, // Intersection near Student Canteen to PUP Auditorium
    {
      id: "WWI3",
      name: "West Wing Intersection 3",
      latitude: 14.597032,
      longitude: 121.00998,
      vulnerabilityLevel: 2.67,
    }, // Intersection near Student Canteen to PUP Auditorium

    // Court Intersection
    {
      id: "CI1",
      name: "Court Intersection 1",
      latitude: 14.598488,
      longitude: 121.010958,
      vulnerabilityLevel: 1,
    }, // Intersection inside courts
    {
      id: "CI2",
      name: "Court Intersection 2",
      latitude: 14.598787,
      longitude: 121.011261,
      vulnerabilityLevel: 1,
    }, // Intersection in Tennis Court

    // Intersection near Gym
    {
      id: "GI1",
      name: "Gym Intersection 1",
      latitude: 14.59881,
      longitude: 121.01066,
      vulnerabilityLevel: 2,
    }, // Intersection to Gym
    {
      id: "GI2",
      name: "Gym Intersection 2",
      latitude: 14.599128,
      longitude: 121.010386,
      vulnerabilityLevel: 2,
    }, // Intersection near Gym
    {
      id: "GI3",
      name: "Gym Intersection 3",
      latitude: 14.599252,
      longitude: 121.011148,
      vulnerabilityLevel: 2,
    }, // Intersection near Gym

    // Intersection near PE Building
    {
      id: "PEI1",
      name: "PE Building Intersection 1",
      latitude: 14.598391,
      longitude: 121.010362,
      vulnerabilityLevel: 2,
    }, // Intersection to PE Building and Swimming Pool
    {
      id: "PEI2",
      name: "PE Building Intersection 2",
      latitude: 14.598386,
      longitude: 121.010231,
      vulnerabilityLevel: 2,
    }, // Intersection near PE Building
    {
      id: "PEI3",
      name: "PE Building Intersection 3",
      latitude: 14.598485,
      longitude: 121.010338,
      vulnerabilityLevel: 2,
    }, // Intersection near Swimmming Pool

    // Pool
    {
      id: "SPI1",
      name: "Swimming Pool Intersection 1",
      latitude: 14.599029,
      longitude: 121.01044,
      vulnerabilityLevel: 2,
    }, // Intersection inside Pool Area
    {
      id: "SPI2",
      name: "Swimming Pool Intersection 2",
      latitude: 14.598832,
      longitude: 121.010608,
      vulnerabilityLevel: 2,
    }, // Intersection inside Pool Area
    {
      id: "SPI3",
      name: "Swimming Pool Intersection 3",
      latitude: 14.598532,
      longitude: 121.010252,
      vulnerabilityLevel: 2,
    }, // Intersection inside Pool Area
    {
      id: "SPI4",
      name: "Swimming Pool Intersection 4",
      latitude: 14.598731,
      longitude: 121.010074,
      vulnerabilityLevel: 2,
    }, // Intersection inside Pool Area

    // PUP Obelisk
    {
      id: "OBL1",
      name: "Obelisk Intersection 1",
      latitude: 14.598053,
      longitude: 121.010771,
      vulnerabilityLevel: 1,
    }, // Intersection, Lagoon
    {
      id: "OBL2",
      name: "Obelisk Intersection 2",
      latitude: 14.598068,
      longitude: 121.010644,
      vulnerabilityLevel: 1,
    }, // Intersection around PUP Obelisk
    {
      id: "OBL3",
      name: "Obelisk Intersection 3",
      latitude: 14.597988,
      longitude: 121.010778,
      vulnerabilityLevel: 1,
    }, // Intersection around PUP Obelisk
    {
      id: "OBL4",
      name: "Obelisk Intersection 4",
      latitude: 14.598126,
      longitude: 121.010929,
      vulnerabilityLevel: 1,
    }, // Intersection around PUP Obelisk
    {
      id: "OBL5",
      name: "Obelisk Intersection 5",
      latitude: 14.598304,
      longitude: 121.01075,
      vulnerabilityLevel: 1,
    }, // Intersection around PUP Obelisk
    {
      id: "OBL6",
      name: "Obelisk Intersection 6",
      latitude: 14.598231,
      longitude: 121.010633,
      vulnerabilityLevel: 1,
    }, // Intersection around PUP Obelisk
    {
      id: "OBL7",
      name: "Obelisk Intersection 7",
      latitude: 14.598254,
      longitude: 121.010892,
      vulnerabilityLevel: 1.5,
    }, // Intersection near PUP Obelisk
    {
      id: "OBL8",
      name: "Obelisk Intersection 8",
      latitude: 14.598265,
      longitude: 121.010565,
      vulnerabilityLevel: 1,
    }, // Intersection to PE Building

    // lagoon
    {
      id: "LAGI1",
      class: "lin",
      name: "Lagoon Intersection 1",
      latitude: 14.597364,
      longitude: 121.010034,
      vulnerabilityLevel: 2.5,
    }, // Intersection, Lagoon
    {
      id: "LAGI2",
      class: "lin",
      name: "Lagoon Intersection 2",
      latitude: 14.597351,
      longitude: 121.010055,
      vulnerabilityLevel: 2.5,
    }, // Intersection, Lagoon
    {
      id: "LAGI3",
      class: "lin",
      name: "Lagoon Intersection 3",
      latitude: 14.597257,
      longitude: 121.010186,
      vulnerabilityLevel: 2.5,
    }, // Intersection, Lagoon
    {
      id: "LAGI4",
      class: "lin",
      name: "Lagoon Intersection 4",
      latitude: 14.597222,
      longitude: 121.010239,
      vulnerabilityLevel: 2,
    }, // Intersection, Lagoon
    {
      id: "LAGI5",
      class: "lin",
      name: "Lagoon Intersection 5",
      latitude: 14.597149,
      longitude: 121.010378,
      vulnerabilityLevel: 2,
    }, // Intersection, Lagoon
    {
      id: "LAGI6",
      class: "lin",
      name: "Lagoon Intersection 6",
      latitude: 14.597192,
      longitude: 121.010541,
      vulnerabilityLevel: 2,
    }, // Intersection, Lagoon
    {
      id: "LAGI7",
      class: "lin",
      name: "Lagoon Intersection 7",
      latitude: 14.597322,
      longitude: 121.0106,
      vulnerabilityLevel: 2,
    }, // Intersection, Lagoon
    {
      id: "LAGI8",
      class: "lin",
      name: "Lagoon Intersection 8",
      latitude: 14.597709,
      longitude: 121.01071,
      vulnerabilityLevel: 2,
    }, // Intersection, Lagoon
    {
      id: "LAGI9a",
      class: "lin",
      name: "Lagoon Intersection 9A",
      latitude: 14.597865,
      longitude: 121.010689,
      vulnerabilityLevel: 2,
    }, // Intersection, Lagoon
    {
      id: "LAGI9b",
      class: "lin",
      name: "Lagoon Intersection 9B",
      latitude: 14.597924,
      longitude: 121.010633,
      vulnerabilityLevel: 2,
    }, // Intersection, Lagoon
    {
      id: "LAGI10",
      class: "lin",
      name: "Lagoon Intersection 10",
      latitude: 14.598001,
      longitude: 121.010561,
      vulnerabilityLevel: 2,
    }, // Intersection, Lagoon
    {
      id: "LAGI11",
      class: "lin",
      name: "Lagoon Intersection 11",
      latitude: 14.598132,
      longitude: 121.010452,
      vulnerabilityLevel: 2,
    }, // Intersection, Lagoon
    {
      id: "LAGI12",
      class: "lin",
      name: "Lagoon Intersection 12",
      latitude: 14.5981,
      longitude: 121.01036,
      vulnerabilityLevel: 2,
    }, // Intersection, Lagoon
    {
      id: "LAGI13",
      class: "lin",
      name: "Lagoon Intersection 13",
      latitude: 14.598052,
      longitude: 121.010216,
      vulnerabilityLevel: 2,
    }, // Intersection, Lagoon
    {
      id: "LAGI14",
      class: "lin",
      name: "Lagoon Intersection 14",
      latitude: 14.598018,
      longitude: 121.010123,
      vulnerabilityLevel: 1.5,
    }, // Intersection, Lagoon
    {
      id: "LAGI15",
      class: "lin",
      name: "Lagoon Intersection 15",
      latitude: 14.597901,
      longitude: 121.010073,
      vulnerabilityLevel: 1.5,
    }, // Intersection, Lagoon
    {
      id: "LAGI16",
      class: "lin",
      name: "Lagoon Intersection 16",
      latitude: 14.597838,
      longitude: 121.010142,
      vulnerabilityLevel: 2,
    }, // Intersection, Lagoon
    {
      id: "LAGI17",
      class: "lin",
      name: "Lagoon Intersection 17",
      latitude: 14.597789,
      longitude: 121.010239,
      vulnerabilityLevel: 2,
    }, // Intersection, Lagoon
    {
      id: "LAGI18",
      class: "lin",
      name: "Lagoon Intersection 18",
      latitude: 14.597707,
      longitude: 121.010229,
      vulnerabilityLevel: 2,
    }, // Intersection, Lagoon
    {
      id: "LAGI19",
      class: "lin",
      name: "Lagoon Intersection 19",
      latitude: 14.597598,
      longitude: 121.010154,
      vulnerabilityLevel: 2,
    }, // Intersection, Lagoon
    {
      id: "LAGI20",
      class: "lin",
      name: "Lagoon Intersection 20",
      latitude: 14.597471,
      longitude: 121.010162,
      vulnerabilityLevel: 2,
    }, // Intersection, Lagoon
    {
      id: "LAGI21",
      class: "lin",
      name: "Lagoon Intersection 21",
      latitude: 14.597367,
      longitude: 121.01028,
      vulnerabilityLevel: 2,
    }, // Intersection, Lagoon
    {
      id: "LAGI22",
      class: "lin",
      name: "Lagoon Intersection 22",
      latitude: 14.597422,
      longitude: 121.010392,
      vulnerabilityLevel: 1.5,
    }, // Intersection, Lagoon
    {
      id: "LAGI23",
      class: "lin",
      name: "Lagoon Intersection 23",
      latitude: 14.597354,
      longitude: 121.010519,
      vulnerabilityLevel: 2,
    }, // Intersection, Lagoon
    {
      id: "LAGI24",
      class: "lin",
      name: "Lagoon Intersection 24",
      latitude: 14.597371,
      longitude: 121.01054,
      vulnerabilityLevel: 2,
    }, // Intersection, Lagoon
    {
      id: "LAGI25",
      class: "lin",
      name: "Lagoon Intersection 25",
      latitude: 14.597362,
      longitude: 121.010569,
      vulnerabilityLevel: 2,
    }, // Intersection, Lagoon
    {
      id: "LAGI26",
      class: "lin",
      name: "Lagoon Intersection 26",
      latitude: 14.597336,
      longitude: 121.010573,
      vulnerabilityLevel: 2,
    }, // Intersection, Lagoon
    {
      id: "LAGI27",
      class: "lin",
      name: "Lagoon Intersection 27",
      latitude: 14.59751,
      longitude: 121.010544,
      vulnerabilityLevel: 2,
    }, // Intersection, Lagoon
    {
      id: "LAGI28",
      class: "lin",
      name: "Lagoon Intersection 28",
      latitude: 14.597683,
      longitude: 121.010605,
      vulnerabilityLevel: 2,
    }, // Intersection, Lagoon
    {
      id: "LAGI29",
      class: "lin",
      name: "Lagoon Intersection 29",
      latitude: 14.597706,
      longitude: 121.010609,
      vulnerabilityLevel: 2,
    }, // Intersection, Lagoon
    {
      id: "LAGI30",
      class: "lin",
      name: "Lagoon Intersection 30",
      latitude: 14.597727,
      longitude: 121.010613,
      vulnerabilityLevel: 2,
    }, // Intersection, Lagoon
    {
      id: "LAGI31",
      class: "lin",
      name: "Lagoon Intersection 31",
      latitude: 14.597763,
      longitude: 121.010462,
      vulnerabilityLevel: 2,
    }, // Intersection, Lagoon
    {
      id: "LAGI32",
      class: "lin",
      name: "Lagoon Intersection 32",
      latitude: 14.597644,
      longitude: 121.010446,
      vulnerabilityLevel: 2,
    }, // Intersection, Lagoon
    {
      id: "LAGI33",
      class: "lin",
      name: "Lagoon Intersection 33",
      latitude: 14.597726,
      longitude: 121.010426,
      vulnerabilityLevel: 2,
    }, // Intersection, Lagoon
    {
      id: "LAGI34",
      class: "lin",
      name: "Lagoon Intersection 34",
      latitude: 14.597846,
      longitude: 121.010549,
      vulnerabilityLevel: 2,
    }, // Intersection, Lagoon
    {
      id: "LAGI35",
      class: "lin",
      name: "Lagoon Intersection 35",
      latitude: 14.597883,
      longitude: 121.010373,
      vulnerabilityLevel: 2,
    }, // Intersection, Lagoon
    {
      id: "LAGI36",
      class: "lin",
      name: "Lagoon Intersection 36",
      latitude: 14.597951,
      longitude: 121.010372,
      vulnerabilityLevel: 2,
    }, // Intersection, Lagoon
    {
      id: "LAGI37",
      class: "lin",
      name: "Lagoon Intersection 37",
      latitude: 14.597927,
      longitude: 121.010484,
      vulnerabilityLevel: 2,
    }, // Intersection, Lagoon
    {
      id: "LAGI38",
      class: "lin",
      name: "Lagoon Intersection 38",
      latitude: 14.597988,
      longitude: 121.01045,
      vulnerabilityLevel: 2,
    }, // Intersection, Lagoon
    {
      id: "LAGI39",
      class: "lin",
      name: "Lagoon Intersection 39",
      latitude: 14.598011,
      longitude: 121.010357,
      vulnerabilityLevel: 2,
    }, // Intersection, Lagoon
    {
      id: "LAGI40",
      class: "lin",
      name: "Lagoon Intersection 40",
      latitude: 14.598044,
      longitude: 121.0103,
      vulnerabilityLevel: 2,
    }, // Intersection, Lagoon

    // Ninoy Aquino LRC
    {
      id: "NALRCI1",
      name: "Ninoy Aquino LRC Intersection 1",
      latitude: 14.597423,
      longitude: 121.009847,
      vulnerabilityLevel: 1.5,
    }, // Intersection, Ninoy Aquino LRC
    {
      id: "NALRCI2",
      name: "Ninoy Aquino LRC Intersection 2",
      latitude: 14.597647,
      longitude: 121.009776,
      vulnerabilityLevel: 2,
    }, // Intersection, Ninoy Aquino LRC
    {
      id: "NALRCI3",
      name: "Ninoy Aquino LRC Intersection 3",
      latitude: 14.597744,
      longitude: 121.009572,
      vulnerabilityLevel: 2,
    }, // Intersection, Ninoy Aquino LRC
    {
      id: "NALRCI4",
      name: "Ninoy Aquino LRC Intersection 4",
      latitude: 14.597665,
      longitude: 121.009366,
      vulnerabilityLevel: 1.5,
    }, // Intersection, Ninoy Aquino LRC
    {
      id: "NALRCI5",
      name: "Ninoy Aquino LRC Intersection 5",
      latitude: 14.597743,
      longitude: 121.009183,
      vulnerabilityLevel: 1,
    }, // Intersection, Ninoy Aquino LRC
    {
      id: "NALRCI6",
      name: "Ninoy Aquino LRC Intersection 6",
      latitude: 14.597545,
      longitude: 121.009604,
      vulnerabilityLevel: 1,
    }, // Intersection, Ninoy Aquino LRC
    {
      id: "NALRCI7",
      name: "Ninoy Aquino LRC Intersection 7",
      latitude: 14.598183,
      longitude: 121.009381,
      vulnerabilityLevel: 2,
    }, // Intersection, Ninoy Aquino LRC
    {
      id: "NALRCI8",
      name: "Ninoy Aquino LRC Intersection 8",
      latitude: 14.598121,
      longitude: 121.010128,
      vulnerabilityLevel: 1,
    }, // Intersection near PE Building
    {
      id: "NALRCI9",
      name: "Ninoy Aquino LRC Intersection 9",
      latitude: 14.598246,
      longitude: 121.010087,
      vulnerabilityLevel: 2,
    }, // Intersection near PE Building
    {
      id: "NALRCI10",
      name: "Ninoy Aquino LRC Intersection 10",
      latitude: 14.598351,
      longitude: 121.009847,
      vulnerabilityLevel: 2,
    }, // Intersection near PE Building
    {
      id: "NALRCI11",
      name: "Ninoy Aquino LRC Intersection 11",
      latitude: 14.598036,
      longitude: 121.009696,
      vulnerabilityLevel: 2,
    }, // Intersection near PE Building

    // Laboratory High School
    {
      id: "LHSI1",
      name: "LHS Intersection 1",
      latitude: 14.597097,
      longitude: 121.009061,
      vulnerabilityLevel: 2,
    }, // Intersection inside Pool Area
    {
      id: "LHSI2",
      name: "LHS Intersection 2",
      latitude: 14.597192,
      longitude: 121.009399,
      vulnerabilityLevel: 2,
    }, // Intersection inside Pool Area
    {
      id: "LHSI3",
      name: "LHS Intersection 3",
      latitude: 14.597411,
      longitude: 121.009336,
      vulnerabilityLevel: 2,
    }, // Intersection inside Pool Area
    {
      id: "LHSI4",
      name: "LHS Intersection 4",
      latitude: 14.597366,
      longitude: 121.009158,
      vulnerabilityLevel: 2,
    }, // Intersection inside Pool Area
    {
      id: "LHSI5",
      name: "LHS Intersection 5",
      latitude: 14.5977,
      longitude: 121.009061,
      vulnerabilityLevel: 1,
    }, // Intersection inside Pool Area

    // Property Building and Motorpool Office
    {
      id: "PBMOI1",
      name: "PBMO Intersection 1",
      latitude: 14.597686,
      longitude: 121.008966,
      vulnerabilityLevel: 1,
    }, // Intersection to Property Building and Motorpool Office
    {
      id: "PBMOI2",
      name: "PBMO Intersection 2",
      latitude: 14.597419,
      longitude: 121.008734,
      vulnerabilityLevel: 2,
    }, // Intersection near Property Building and Motorpool Office
  ];

  // Edges
  var edges = [
    // Oval: Grandstand, CommunityBuilding, OvalE1, OvalE2
    ["Oval", "Grandstand"],
    ["Oval", "CommunityBuilding"],
    ["Oval", "OvalE1"],
    ["Oval", "OvalE2"],
    ["CommunityBuilding", "OvalE1"],
    ["CommunityBuilding", "OvalE2"],
    ["Oval", "OvalE1"],
    ["Oval", "OvalE2"],
    ["MainGate", "OvalE1"],
    ["MainGate", "InfoCenter"],
    ["MainGate", "I1"],
    ["InfoCenter", "I1"],
    ["I1", "OvalE1"],
    ["InfoCenter", "OvalE1"],
    ["I1", "GI3"],
    ["AMShrine", "AMSE"],
    ["AMShrine", "AME"],
    ["AMMuseum", "AMME"],
    ["AMME", "AME"],
    // I1: I2,
    ["I1", "I2"],

    // I2: I1, Souvenir, I3
    ["I2", "Souvenir"],
    ["I2", "I3"],

    // I3: I2, CHI1
    ["I3", "CHI1"],

    ["I4", "I5"],
    ["I4", "AMME"],
    ["I4", "NWE1"],
    ["I4", "NWE3"],
    ["I4", "CHI8"],
    ["I4", "CHI9"],

    ["CHI9", "I5"],
    ["CHI1", "I5"],
    ["I3", "I5"],

    // CHI1 (Chapel Intersection 1) -> CH, I3, CHI9, OvalE2, CHI2
    ["CHI1", "CHI9"],
    ["CHI1", "OvalE2"],
    ["CHI1", "CHI2"],

    // CHI2 (Chapel Intersection 2) -> CH, CHI1, OvalE2, CHI3
    ["CHI2", "OvalE2"],
    ["CHI2", "CHI3"],

    // CHI3 (Chapel Intersection 3) -> CH, CHI2, CH, CHI4
    ["CHI3", "CHI4"],

    // CHI4 (Chapel Intersection 4) -> CH, CHI3, CHI5, NFSB
    ["CHI4", "CHI5"],
    ["CHI4", "NFSB"],

    // CHI5 (Chapel Intersection 5) -> CH, CHI4, CHI6, NFSB
    ["CHI5", "CHI6"],
    ["CHI5", "NFSB"],

    // NFSB (Nutrition and Food Science Building) -> CHI4, CHI5

    // CHI6 (Chapel Intersection 6) -> CH, CHI5, CHI7, CHI10
    ["CHI6", "CHI7"],
    ["CHI6", "CHI10"],

    // CHI7 (Chapel Intersection 7) -> CH, CHI6, CHI8, MDE2
    ["CHI7", "MDE2"],
    ["CHI7", "CHI8"],

    // CHI8 (Chapel Intersection 7) -> CH, CHI7, CHI9, MDE2
    ["CHI8", "CHI9"],
    ["CHI8", "MDE2"],

    // CHI9 (Chapel Intersection 7) -> CH, CHI8, CHI1, NWE1
    ["CHI9", "NWE1"],

    // CHI10 (Chapel Intersection 7) -> CHI8, CHI1, NWE1
    ["CHI10", "EWI1"],

    // CH (Chapel) -> CHI1, CHI2, CHI3, CHI4, CHI5, CHI6, CHI7, CHI8
    ["CH", "CHI1"],
    ["CH", "CHI2"],
    ["CH", "CHI3"],
    ["CH", "CHI4"],
    ["CH", "CHI5"],
    ["CH", "CHI6"],
    ["CH", "CHI7"],
    ["CH", "CHI8"],
    ["CH", "CHI9"],

    // EWI1 (East Wing Intersection 1) -> CH10, EWE3, EWI2
    ["EWI1", "EWE3"],
    ["EWI1", "EWI2"],

    // EWI2 (East Wing Intersection 2) -> EWI1, EWE3, EWE1, SWI1
    ["EWI2", "EWE3"],
    ["EWI2", "EWE1"],
    ["EWI2", "SWI1"],

    // EWE1 (East Wing Exit 1) -> EWI2, EWE2, SWI1
    ["EWE1", "EWE2"],
    ["EWE1", "SWI1"],

    // EWE2 (East Wing Exit 1) -> EWE1, SWI1
    ["EWI2", "SWI1"],

    // CDM (Campus Development and Maintenance) -> EWI2, SWI1, EWE2
    ["CDM", "EWI2"],
    ["CDM", "SWI1"],
    ["CDM", "EWE2"],

    // MBEW (Main Building East Wing) -> EWE1, EWE2, EWE3, MDI6
    ["MBEW", "EWE1"],
    ["MBEW", "EWE2"],
    ["MBEW", "EWE3"],
    ["MBEW", "MDI6"],

    // MBMD (Main Building Main Dome) -> MDI1, MDI2, MDI3, MDI4, MDI5, MDI6
    ["MBMD", "MDI1"],
    ["MBMD", "MDI2"],
    ["MBMD", "MDI3"],
    ["MBMD", "MDI4"],
    ["MBMD", "MDI5"],
    ["MBMD", "MDI6"],

    // MDI5 (Main Dome Intersection 5) -> MDE2, MDI4, MDI6
    ["MDI5", "MDE2"],
    ["MDI5", "MDI4"],
    ["MDI5", "MDI6"],

    // MDI4 (Main Dome Intersection 4) -> MDE5, MDI3, MBNW
    ["MDI4", "MDI3"],
    ["MDI4", "MBNW"],

    // MBNW (Main Building North Wing) -> MDI4, NWE1, NWE2, NWE3
    ["MBNW", "NWE1"],
    ["MBNW", "NWE2"],
    ["MBNW", "NWE3"],

    // NWE3 (North Wing Exit 3) -> MBNW, CHI8, CHI9, AME, NWE1
    ["NWE3", "NWE1"],
    ["NWE3", "AME"],

    // NWE1 (North Wing Exit 1) -> MBNW, NWE3, AME
    ["NWE1", "AME"],

    // NWE2 (North Wing Exit 2) -> MBNW, NWI1, AME
    ["NWE2", "NWI1"],
    ["NWE2", "AME"],

    // NWI2 (North Wing Intersection 2) -> NWE2, OBL3, NWI1
    ["NWI2", "OBL3"],
    ["NWI2", "NWI1"],

    // NWI1 (North Wing Intersection 1) -> NWI2, MDE1, LAGI6, TMBI2
    ["NWI1", "MDE1"],
    ["NWI1", "LAGI6"],
    ["NWI1", "TMBI2"],

    // MDE2 (Main Dome Exit 2) -> CHI6, CHI7, CHI8
    ["MDE2", "CHI6"],

    // MBWW (Main Building West Wing) -> MDI2, WWE1, WWE2, WWE3
    ["MBWW", "WWE1"],
    ["MBWW", "WWE2"],
    ["MBWW", "WWE3"],
    ["MBWW", "MDI2"],

    // WWE1 (West Wing Exit 1) -> MBWW, WWE2, WWE3, WWI1, WWI2, SB
    ["WWE1", "WWE2"],
    ["WWE1", "WWE3"],
    ["WWE1", "WWI1"],
    ["WWE1", "WWI2"],
    ["WWE1", "SB"],

    // WWE2 (West Wing Exit 2) -> MBWW, WWE1, WWI2, TMBI2, PS
    ["WWE2", "WWI2"],
    ["WWE2", "TMBI2"],
    ["WWE2", "PS"],

    // WWE3 (West Wing Exit 3) -> MBWW, WWE1, WWI1, SWI3, PS
    ["WWE3", "WWI1"],
    ["WWE3", "SWI3"],
    ["WWE3", "PS"],

    // PS (PUP Pumping Station) -> WWI1, SWI3, WWE3
    ["PS", "WWI1"],
    ["PS", "SWI3"],

    // SWI3 (South Wing Intersection 3) -> PS, WWE3, WWI1, SWI2
    ["SWI3", "WWI1"],
    ["SWI3", "SWI2"],

    // SWI2 (South Wing Intersection 2) -> SWE1, SWI1, SWE2
    ["SWI2", "SWE1"],
    ["SWI2", "SWI1"],
    ["SWI2", "SWE2"],

    // SWE1 (South Wing Exit 1) -> SWI2, SWI4
    ["SWE1", "SWI4"],

    // SWI4 (South Wing Intersection 4) -> SWE1, SWI5, SWI9
    ["SWI4", "SWI5"],
    ["SWI4", "SWI9"],

    // SWI5 (South Wing Intersection 5) -> SWI4, SWI8
    ["SWI5", "SWI8"],

    // SWI8 (South Wing Intersection 8) -> SWI5, SWI6, MDI1, MBSW
    ["SWI8", "SWI6"],
    ["SWI8", "MDI1"],
    ["SWI8", "MBSW"],

    // MBSW (Main Building South Wing) -> SWI8, SWI9
    ["MBSW", "SWI9"],

    // SWI9 (South Wing Intersection 9) -> SWI4, MBSW, SWI7
    ["SWI9", "SWI7"],

    // SWI7 (South Wing Intersection 7) -> SWI6, SWI9, SWE2
    ["SWI7", "SWI6"],
    ["SWI7", "SWE2"],

    // SWI6 (South Wing Intersection 6) -> SWI7, SWI8

    // SWE2 (South Wing Exit 2) -> SWI7, SWI2, SWI1
    ["SWE2", "SWI1"],

    // B1E: GI3, Gate2
    ["B1E", "Gate2"],

    // B1: B1E
    ["B1", "B1E"],

    // Gymnasium: GE1, GE2, GE3
    ["Gymnasium", "GE1"],
    ["Gymnasium", "GE2"],
    ["Gymnasium", "GE3"],

    // GE1: GI3, B1E
    ["GE1", "B1E"],

    // GE2: GE3, GI1, GI3

    // GE3: GI1, GE2, GI3
    ["GE3", "GI1"],
    ["GE3", "GE2"],
    ["GE3", "GI3"],

    // GI3: GI1, GE2, GE1, B1E, I1, GE3
    ["GI3", "GE2"],
    ["GI3", "GE1"],
    ["GI3", "B1E"],
    ["GI3", "I1"],

    // CI2: CI1
    ["CI2", "CI1"],

    // CI1: OBL5, OBL7, CI2
    ["CI1", "OBL5"],
    ["CI1", "OBL7"],

    // GI1: PEI3, GI2, GI3, GE1, GE2, GE3
    ["GI1", "GI3"],
    ["GI1", "GE1"],
    ["GI1", "GE2"],
    ["GI1", "GE3"],

    // GI2: GI1
    ["GI2", "GI1"],

    // PEI1: OBL8, PEI2, PEI3
    ["PEI1", "PEI2"],
    ["PEI1", "PEI3"],

    // SE: PEI1, PEI2, SPI3, SPI2, TahananAlumni, PE
    ["SE", "SPI2"],
    ["SE", "TahananAlumni"],
    ["SE", "PE"],

    // SPI1: SPI2, SPI4, Pool

    // SPI2: SPI3, SPI1
    ["SPI2", "SPI1"],

    // SPI3: SE, SPI2, SPI4
    ["SPI3", "SE"],
    ["SPI3", "SPI2"],

    // SPI4: SPI3, SPI1, Pool
    ["SPI4", "SPI3"],
    ["SPI4", "SPI1"],

    // Pool: SPI1, SPI4
    ["Pool", "SPI1"],
    ["Pool", "SPI4"],

    // PEI2: PEI1, PE, TahananAlumni, SE
    ["PEI2", "PEI1"],
    ["PEI2", "PE"],
    ["PEI2", "TahananAlumni"],
    ["PEI2", "SE"],

    // PEI3: PEI1, PE, TahananAlumni, SE, GI1
    ["PEI3", "PEI1"],
    ["PEI3", "PE"],
    ["PEI3", "TahananAlumni"],
    ["PEI3", "SE"],
    ["PEI3", "GI1"],

    // OBL8: NALRCI8, OBL6, PEI1
    ["OBL8", "NALRCI8"],
    ["OBL8", "PEI1"],

    // OBL7: OBL4, OBL5, CI1, Souvenir, I1
    ["OBL7", "CI1"],
    ["OBL7", "Souvenir"],
    ["OBL7", "I1"],

    // OBL6: OBL2, OBL5, OBL8
    ["OBL6", "OBL8"],

    // OBL5: OBL6, OBL7
    ["OBL5", "OBL6"],
    ["OBL5", "OBL7"],

    // OBL4: OBL3, OBL7, AME
    ["OBL4", "OBL7"],
    ["OBL4", "AME"],

    // OBL3: LAGE1, OBL1, OBL2, OBL4
    ["OBL3", "OBL4"],

    // OBL2: LAGE1, OBL1, OBL3, OBL6
    ["OBL2", "OBL3"],
    ["OBL2", "OBL6"],

    // OBL1: LAGE1, OBL2, OBL3
    ["OBL1", "OBL2"],
    ["OBL1", "OBL3"],

    // LAGE1: LAGI9b, OBL1, OBL2, OBL3
    ["LAGE1", "LAGI9b"],
    ["LAGE1", "OBL1"],
    ["LAGE1", "OBL2"],
    ["LAGE1", "OBL3"],

    // LAGI40: LAGI39, LAGI13

    // LAGI39: LAGI36, LAGI40
    ["LAGI39", "LAGI40"],

    // LAGI38: LAGI37, LAGI12

    // LAGI37: LAGI38, LAGI10
    ["LAGI37", "LAGI38"],

    // LAGI36: LAGI35, LAGI37, LAGI39
    ["LAGI36", "LAGI37"],
    ["LAGI36", "LAGI39"],

    // LAGI35: LAGI33, LAGI36
    ["LAGI35", "LAGI36"],

    // LAGI34: LAGI31, LAGI37, LAGI9b
    ["LAGI34", "LAGI37"],

    // LAGI33: LAGI31, LAGI32, LAGI35
    ["LAGI33", "LAGI35"],

    // LAGI32: LAGI22, LAGI33
    ["LAGI32", "LAGI33"],

    // LAGI31: LAGI30, LAGI33, LAGI34
    ["LAGI31", "LAGI33"],
    ["LAGI31", "LAGI34"],

    // LAGI30: LAGI29, LAGI31
    ["LAGI30", "LAGI31"],

    // LAGI29: LAGI28, LAGI30
    ["LAGI29", "LAGI30"],

    // LAGI28: LAGI27, LAGI29
    ["LAGI28", "LAGI29"],

    // LAGI27: LAGI25, LAGI28
    ["LAGI27", "LAGI28"],

    // LAGI26: LAGI7, LAGI25
    ["LAGI26", "LAGI25"],

    // LAGI25: LAGI26, LAGI27, LAGI24
    ["LAGI25", "LAGI26"],
    ["LAGI25", "LAGI27"],

    // LAGI24: LAGI25, LAGI23
    ["LAGI24", "LAGI25"],

    // LAGI23: LAGI24, LAGI22
    ["LAGI23", "LAGI24"],

    // LAGI22: LAGI4, LAGI23, LAGI32
    ["LAGI22", "LAGI23"],
    ["LAGI22", "LAGI32"],

    // LAGI21: LAGI3, LAGI22
    ["LAGI21", "LAGI22"],

    // LAGI20, LAGI2, LAGI21, LAGI19
    ["LAGI20", "LAGI21"],

    // LAGI19: LAGI20, LAGI18
    ["LAGI19", "LAGI20"],

    // LAGI18: LAGI19, LAGI17
    ["LAGI18", "LAGI19"],

    // LAGI17: LAGI18, LAGI16
    ["LAGI17", "LAGI18"],

    // LAGI16: LAGI17, LAGI15
    ["LAGI16", "LAGI17"],

    // LAGI15: LAGI16, LAGI14
    ["LAGI15", "LAGI16"],

    // LAGI14: LAGI15, LAGI13
    ["LAGI14", "LAGI15"],

    // LAGI13: LAGI14, LAGI40, LAGI12
    ["LAGI13", "LAGI14"],
    ["LAGI13", "LAGI40"],

    // LAGI12: LAGI13, LAGI11, LAGI38
    ["LAGI12", "LAGI13"],
    ["LAGI12", "LAGI38"],

    // LAGI11: LAGI12, LAGI10
    ["LAGI11", "LAGI12"],

    // LAGI10: LAGI11, LAGI9b, LAGI37
    ["LAGI10", "LAGI11"],
    ["LAGI10", "LAGI37"],

    // LAGI9b: LAGI10, LAGI34, LAGI9a, LAGE1
    ["LAGI9b", "LAGI10"],
    ["LAGI9b", "LAGI34"],

    // LAGI9a: LAGI8, LAGI9b
    ["LAGI9a", "LAGI9b"],

    // LAGI8: LAGI7, LAGI9a
    ["LAGI8", "LAGI9a"],

    // LAGI7: LAGI6, LAGI26, LAGI8
    ["LAGI7", "LAGI26"],
    ["LAGI7", "LAGI8"],

    // LAGI6: LAGI5, LAGI7
    ["LAGI6", "LAGI7"],

    // LAGI5: LAGI4, LAGI6
    ["LAGI5", "LAGI6"],

    // LAGI4: LAGI3, LAGI22, LAGI5
    ["LAGI4", "LAGI22"],
    ["LAGI4", "LAGI5"],

    // LAGI3: LAGI2, LAGI21, LAGI4
    ["LAGI3", "LAGI21"],
    ["LAGI3", "LAGI4"],

    // LAGI2: LAGI1, LAGI20, LAGI3
    ["LAGI2", "LAGI20"],
    ["LAGI2", "LAGI3"],

    // LAGI1: LAGE2, LAGI2
    ["LAGI1", "LAGI2"],

    // LAGE2: NALRCI1, TMBI3, LAGI1
    ["LAGE2", "LAGI1"],

    // TMBI3: TMBI1, LAGE2
    ["TMBI3", "LAGE2"],

    // TMBI1: TMBI3, TMBI2, WWI3
    ["TMBI1", "TMBI3"],
    ["TMBI1", "WWI3"],

    // TMBI2: TMBI1, WWI2
    ["TMBI2", "TMBI1"],
    ["TMBI2", "WWI2"],

    // PS: WWI1, SWI3, SWI2
    ["PS", "WWI1"],
    ["PS", "SWI3"],
    ["PS", "SWI2"],

    // SC: SCE
    ["SC", "SCE"],

    // SCE: WWI3, WWI2
    ["SCE", "WWI2"],
    ["SCE", "WWI3"],

    // SB: WWI2, WWI1
    ["SB", "WWI2"],
    ["SB", "WWI1"],

    // WWWI3:

    // PK: PKE
    ["PK", "PKE"],
    
    // NALRC: NALRCE
    ['NALRC', 'NALRCE'],

    // NALRCI1: NALRCI2, NACLRCI6, PKE, WWI3, LAGE2
    ["NALRCI1", "PKE"],
    ["NALRCI1", "WWI3"],
    ["NALRCI1", "LAGE2"],

    // NALRCI9: NALRCI10, NALRCI8
    ["NALRCI9", "NALRCI8"],

    // NALRCI10: NALRCI11, NALRCI9, B2
    ["NALRCI10", "NALRCI9"],
    ["NALRCI10", "B2"],

    // NALRCI11: NALRCI7, NALRCI10, B2
    ["NALRCI11", "NALRCI10"],
    ["NALRCI11", "B2"],

    // NALRCI7: NALRCI5, NALRCI11
    ["NALRCI7", "NALRCI11"],

    // NALRCE: NALRCI2, NALRCI3, NALRCI6
    ["NALRCE", "NALRCI2"],
    ["NALRCE", "NALRCI3"],
    ["NALRCE", "NALRCI6"],

    // MT: NALRCI3, NALRCI4, NALRCI5
    ["MT", "NALRCI3"],
    ["MT", "NALRCI4"],
    ["MT", "NALRCI5"],

    // NALRCI3: NALRCE, NALRCI4
    ["NALRCI3", "NALRCI4"],

    // NALRCI4: NALRCI3, NALRCI5, NALRCI6
    ["NALRCI4", "NALRCI5"],
    ["NALRCI4", "NALRCI6"],

    // NALRCI5: NALRCI4, LHSI5, PBMOI1, NALRCI7
    ["NALRCI5", "PBMOI1"],
    ["NALRCI5", "LHSI5"],
    ["NALRCI5", "NALRCI7"],

    ["LHSI1", "LHSE1"],
    ["LHSI1", "LHSI2"],
    ["LHSE5", "LHSI1"],
    ["LHSE5", "LHSI2"],
    ["LHSI2", "LHSI3"],
    ["LHSI3", "LHSE4"],
    ["LHSI4", "LHSE4"],
    ["LHSE3", "LHSE4"],
    ["LHSE2", "LHSE3"],
    ["LHSI4", "LHSE3"],
    ["LHSI4", "LHSE2"],
    ["LHSI5", "LHSI4"],
    ["LHSI5", "LHSE2"],
    ["LHSI5", "LHSE1"],
    ["PBMOI1", "LHSI5"],
    ["PBMOI1", "LHSE1"],
    ["PBMOI1", "PBMOI2"],
    ["PBMOI2", "PBMO"],
    ["PBMOI2", "PO"],
  ];

  // Add the initialized vertices
  // Adds all the elements of the vertices array to the graph using the function addVertex
  for (var i = 0; i < vertices.length; i++) {
    // Gets the x and y of specific vertex
    var converted = convertGeo(
      vertices[i].latitude,
      vertices[i].longitude,
      mapWidth,
      mapHeight,
      leftLong,
      rightLong,
      latBottom
    );

    // Adds vertices
    campus_map.addVertex(
      vertices[i].id,
      vertices[i].latitude,
      vertices[i].longitude,
      converted.x,
      converted.y,
      vertices[i].vulnerabilityLevel
    );
  }

  // Add the initialized edges
  for (var i = 0; i < edges.length; i++) {
    var a = edges[i][0];
    var b = edges[i][1];
    var node_a = campus_map.vertexInfo.get(a);
    var node_b = campus_map.vertexInfo.get(b);
    var edge_cost = calculateEdge(node_a.x, node_a.y, node_b.x, node_b.y, 2); // Note: order 2 for Euclidean
    edges[i].push(edge_cost);
    campus_map.addEdge(a, b, edge_cost);
  }

  // A* Search Algorithm

  var blueIcon = new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [32, 51],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  var redIcon = new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [31, 47],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  var greenIcon = new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  var violetIcon = new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  var greyIcon = new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  var blackIcon = new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

let originNode;
let originNodeName;
let markers = []; // Store markers to manage click events later

// Markers for nodes
vertices.forEach((vertice) => {
    let icon;
    switch (vertice.class) {
        case "bn":
            icon = redIcon;
            break;
        case "en":
            icon = violetIcon;
            break;
        case "dn":
            icon = blueIcon;
            break;
        case "gn":
            icon = greenIcon;
            break;
        case "lin":
        case "min":
            icon = greyIcon;
            break;
        default:
            icon = blackIcon;
            break;
    }

    var current = L.marker([vertice.latitude, vertice.longitude], { icon: icon })
        .addTo(map)
        .bindPopup(vertice.name)
        .on('click', function () {
            // Set the origin to the clicked marker's ID and name
            setOrigin(vertice.id, vertice.name);
            document.querySelector(".reset").style = "display: none";
            document.getElementById("start-navigation").style = "width: 95px; margin-left: 10px";
            document.getElementById("start-navigation").innerHTML = "START";
            document.querySelector(".navigate-info").style = "display: flex; ";
        });

    markers.push(current); // Add the marker to the array
});

function setOrigin(originId, originName) {
    console.log('Origin set to:', originId);
    // Perform actions to update the origin for pathfinding
    originNode = originId;
    originNodeName = originName;

    // Update the origin input field value and display the name
    document.getElementById("origin").value = originNodeName;
    document.getElementById("origin").disabled = false;

    // Enable the start navigation button
    document.getElementById("start-navigation").disabled = false;

    // Show the navigate content
    document.getElementById("navigate-content").style.display = "block";
}

function getNodeIdFromCoordinates(lat, lon, vertexInfo) {
    for (let [nodeId, info] of vertexInfo) {
        if (info.latitude === lat && info.longitude === lon) {
            return nodeId;
        }
    }
    return null;
}

function visualizePath(path, color, weight) {
    var polyline = L.polyline(path, { color: color, weight: weight }).addTo(map);
    map.fitBounds(polyline.getBounds()); // Adjust the map view to fit the polyline
}

// Navigation function
function startNavigation() {
    if (originNode) {
        const { shortestPath, alternativePath } = aStarSearch(campus_map, originNode, "Oval");

        console.log("Shortest path found:", shortestPath);
        console.log("Alternative path found:", alternativePath);

        visualizePath(shortestPath, "red", 7);
        visualizePath(alternativePath, "purple", 5);

        document.getElementById("start-navigation").style.display = "none";
        document.getElementById("navigate-content").className = "active";

        // Disable only the click events for setting the origin, keep popups available
        markers.forEach(marker => {
            marker.off('click');
            marker.on('click', function () {
                this.openPopup();
            });
        });
    } else {
        console.error("Origin node is not set.");
    }

    document.querySelector(".reset").style = "display: block";
}

function resetNavigation() {
    location.reload();
}

// Ensure that these functions are available globally if needed
window.startNavigation = startNavigation;
window.resetNavigation = resetNavigation;

// Disable the start navigation button initially
document.getElementById("start-navigation").disabled = true;


});
