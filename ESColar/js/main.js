document.addEventListener('DOMContentLoaded', () => {
    // Leaflet
    // Define northeast and southwest lat and long to limit viewable area
    var ne = L.latLng(14.599792, 121.015320);
    var sw = L.latLng(14.595800, 121.008200);
    var bounds = L.latLngBounds(ne, sw);

    // Initialize map, set view, zoom level, max bounds (maximum viewable area)
    var map = L.map('map', {
        center: [14.59785, 121.01098],
        minZoom: 18,
        zoom: 19,
        maxBounds: bounds
    });
    
    // Set max zoom level
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 22,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Not included in actual application, defines popup from popup method in Leaflet
    var popup = L.popup();

    // Not included in actual application, shows latitude and longitude of clicked area; assists in development
    function onMapClick(e) {
        popup
            .setLatLng(e.latlng)
            .setContent("You clicked the map at " + e.latlng.toString())
            .openOn(map);
    }

    // Activates the onMapClick function upon clicking the map
    map.on('click', onMapClick);

    // Defines mapWidth and mapHeight by dynamically getting the width and height of the map
    const mapWidth = document.getElementById("map").offsetWidth;
    const mapHeight = document.getElementById("map").offsetHeight;

    // Graph Data Structure, class that contains main functions for the development of the graph
    class Campus {
        // Passes the number of nodes as a parameter to the constructor method
        constructor(nodesNum) {
            // Parameter is assigned to this constructors' nodesNum
            this.nodesNum = nodesNum;
            // Creates new map object as adjacency list
            this.adjacent = new Map();
            // Creates new map object for vertex information
            this.vertexInfo = new Map();
        }

        // Adds vertex to graph data structure
        addVertex(id, latitude, longitude, x, y) {
            // Adds a key-value pair in the map; id serves as the key, and [] (empty array) serves as the value
            this.adjacent.set(id, []);
            // Sets the id, latitude, longitude, x, and y of specific vertex
            this.vertexInfo.set(id, {latitude: latitude, longitude: longitude, x: x, y: y})
        }

        // Adds edge between node a and node b
        addEdge(a, b, edge_cost) {
            this.adjacent.get(a).push({ node: b, edge_cost: edge_cost });
            this.adjacent.get(b).push({ node: a, edge_cost: edge_cost });
        }

        printCampusMap() {
            var vertices = this.adjacent.keys();

            for (var i of vertices) {
                var adjacency = this.adjacent.get(i);
                var conc = "";

                for (var j of adjacency) {
                    conc += `(${j.node}, ${j.edge_cost})`;
                }

                console.log(i + "->" + conc);
            }
        }
    }

    // Convert latitude and longitude to x and y; See: https://stackoverflow.com/questions/2103924/mercator-longitude-and-latitude-calculations-to-x-and-y-on-a-cropped-map-of-the
    function convertGeo(latitude, longitude, width, height, leftLong, rightLong, latBottom) {
        const radLatBottom = latBottom * (Math.PI / 180);
        const radLat = latitude * (Math.PI / 180);
        const long = rightLong - leftLong;
        const mapWidth = ((width / long) * 360) / (2 * Math.PI);
        const offsetY = (mapWidth / 2 * Math.log((1 + Math.sin(radLatBottom)) / (1 - Math.sin(radLatBottom))));

        const x = (longitude - leftLong) * (width / long);
        const y = height - ((width / 2 * Math.log((1 + Math.sin(radLat)) / (1 - Math.sin(radLat)))) - offsetY);

        return {x, y};
    }

    // Function to calculate the edges of each node using node a's x and y, and node b's x and y, as well as the order (p)
    // Uses Minkowski's Distance Formula
    function calculateEdge(ax, ay, bx, by, p) {
        const edge = Math.pow(Math.abs(ax - bx) ** p + Math.abs(ay - by) ** p, 1 / p);

        return edge;
    }

    // Initializes left longitude, right longitude, bottom latitude
    const leftLong = 121.008200;
    const rightLong = 121.015320;
    const latBottom = 14.595800;

    // Initializes new campus_map using the Campus() class
    var campus_map = new Campus();

    // Vertices
    var vertices = [{id: 'Oval', name: "Oval", latitude: 14.598115, longitude: 121.012039},  // Buildings / Areas
        {id: 'Grandstand', name: "Grandstand", latitude: 14.598021, longitude: 121.011524},
        {id: 'CommunityBuilding', name: "Community Building", latitude: 14.598094, longitude: 121.012484},
        {id: 'InfoCenter', name: "Information Center", latitude: 14.599077, longitude: 121.011583},
        {id: 'BCourt', name: "Court", latitude: 14.598635, longitude: 121.010821},
        {id: 'CommunityBuilding', name: "Grandstand", latitude: 14.598094, longitude: 121.012484},
        {id: 'B1', name: "Building 1", latitude: 14.599585, longitude: 121.011070},
        {id: 'Gymnasium', name: "PUP Gymnasium", latitude: 14.599237, longitude: 121.010743},
        {id: 'Pool', name: "Swimming Pool Area", latitude: 14.5989, longitude: 121.010211},
        {id: 'Souvenir', name: "PUP Souvenir Shop", latitude: 14.598428, longitude: 121.011235},
        {id: 'AMShrine', name: "Apolinario Mabini Shrine", latitude: 14.598195, longitude: 121.011151},
        {id: 'AMMuseum', name: "Apolinario Mabini Museum", latitude: 14.597905, longitude: 121.01122},
        {id: 'PE', name: "PE Building", latitude: 14.598451, longitude: 121.010134},
        {id: 'TahananAlumni', name: "Tahanan ng Alumni", latitude: 14.598507, longitude: 121.010171},

        {id: 'B2', name: "Building 2", latitude: 14.598326, longitude: 121.009626},
        {id: 'MT', name: "Millenium Tower", latitude: 14.597809, longitude: 121.009356},
        {id: 'LaboratoryHS', name: "PUP Laboratory High School", latitude: 14.597237, longitude: 121.009122},
        {id: 'PBMO', name: "Property Building and Motorpool Office", latitude: 14.597385, longitude: 121.00857},
        {id: 'PO', name: "Printing Office", latitude: 14.597303, longitude: 121.008731},
        {id: 'SB', name: "Sampaguita Building", latitude: 14.596827, longitude: 121.009862},
        {id: 'PS', name: "PUP Pumping Station", latitude: 14.596573, longitude: 121.010136},
        
        // Exits
        {id: 'OvalE1', name: "Oval Exit/Entrance 1", latitude: 14.598949, longitude: 121.011719},
        {id: 'OvalE2', name: "Oval Exit/Entrance 2", latitude: 14.597432, longitude: 121.011698},
        {id: 'B1E', name: "B1 Exit", latitude: 14.599458, longitude: 121.011202},
        {id: 'GE1', name: "Gymnasium Exit 1", latitude: 14.599438, longitude: 121.010976},
        {id: 'GE2', name: "Gymnasium Exit 2", latitude: 14.599181, longitude: 121.010991},
        {id: 'GE3', name: "Gymnasium Exit 3", latitude: 14.598992, longitude: 121.010778},
        {id: 'AMSE', name: "Shrine Exit", latitude: 14.598091, longitude: 121.01112},
        {id: 'AMME', name: "Museum Exit", latitude: 14.597875, longitude: 121.01118},
        {id: 'AME', name: "Apolinario Mabini Museum", latitude: 14.597942, longitude: 121.011037},
        {id: 'SE', name: "Swimming Pool Exit", latitude: 14.598515, longitude: 121.0102777},

        {id: 'LAGE1', name: "Lagoon Exit 1", latitude: 14.597946, longitude: 121.010655},
        {id: 'LAGE2', name: "Lagoon Exit 2", latitude: 14.597332, longitude: 121.010008},

        {id: 'NALRCE', name: "Ninoy Aquino Learning Resource Center Exit", latitude: 14.597726, longitude: 121.009692},
        
        {id: 'PKE', name: "PUP Kasarianlan Exit", latitude: 14.597168, longitude: 121.009878},
        {id: 'SCE', name: "Student Canteen Exit", latitude: 14.59699, longitude: 121.009926},
        {id: 'PKE', name: "PUP Kasarianlan Exit", latitude: 14.597168, longitude: 121.009878},

        {id: 'LHSE1', name: "Laboratory High School Exit 1", latitude: 14.597524, longitude: 121.008955},
        {id: 'LHSE2', name: "Laboratory High School Exit 2", latitude: 14.597394, longitude: 121.009122},
        {id: 'LHSE3', name: "Laboratory High School Exit 3", latitude: 14.597344, longitude: 121.009164},
        {id: 'LHSE4', name: "Laboratory High School Exit 4", latitude: 14.59738, longitude: 121.009305},
        {id: 'LHSE5', name: "Laboratory High School Exit 5", latitude: 14.597173, longitude: 121.009289},

        // Gates
        {id: 'MainGate', name: "Main Gate", latitude: 14.599127, longitude: 121.011823},
        {id: 'Gate2', name: "Gate 2", latitude: 14.5995, longitude: 121.011406},

        // Paths / Intersections
        {id: 'I1', name: "Intersection 1", latitude: 14.598854, longitude: 121.011538}, // Intersection to Gym and main path, near entrance
        {id: 'I2', name: "Intersection 2", latitude: 14.598218, longitude: 121.011368}, // Intersection to PUP Chapel
        {id: 'I3', name: "Intersection 3", latitude: 14.59786, longitude: 121.011368}, // Intersection to PUP Chapel
        
        // Main Building: North Wing (Under Construction)
        {id: 'NWI1', name: "North Wing Intersection 1", latitude: 14.597159, longitude: 121.010624}, // Intersection around Lagoon
        {id: 'NWI2', name: "North Wing Intersection 2", latitude: 14.597694, longitude: 121.010789}, // Intersection around Lagoon

        // To Main Building
        {id: 'TMBI1', name: "Intersection to Main Building 1", latitude: 14.597119, longitude: 121.010298}, // Intersection near Auditorium from I25
        {id: 'TMBI2', name: "Intersection to Main Building 2", latitude: 14.597074, longitude: 121.010397}, // Intersection near Auditorium from I24
        {id: 'TMBI3', name: "Intersection to Main Building 3", latitude: 14.597243, longitude: 121.010119}, // Intersection near Auditorium

        // Chapel
        {id: 'CHI1', name: "Chapel Intersection 1", latitude: 14.597427, longitude: 121.011589}, // Intersection to PUP Chapel
        {id: 'CHI2', name: "Chapel Intersection 2", latitude: 14.597342, longitude: 121.011693}, // Intersection around PUP Chapel
        {id: 'CHI3', name: "Chapel Intersection 3", latitude: 14.597206, longitude: 121.011758}, // Intersection around PUP Chapel
        {id: 'CHI4', name: "Chapel Intersection 4", latitude: 14.59698, longitude: 121.011718}, // Intersection around PUP Chapel
        {id: 'CHI5', name: "Chapel Intersection 5", latitude: 14.59684, longitude: 121.011536}, // Intersection around PUP Chapel
        {id: 'CHI6', name: "Chapel Intersection 6", latitude: 14.596846, longitude: 121.011302}, // Intersection around PUP Chapel, to around East Wing
        {id: 'CHI7', name: "Chapel Intersection 7", latitude: 14.597053, longitude: 121.011109}, // Intersection around PUP Chapel, near Main Dome
        {id: 'CHI8', name: "Chapel Intersection 8", latitude: 14.597316, longitude: 121.011151}, // Intersection around PUP Chapel, near North Wing
        {id: 'CHI9', name: "Chapel Intersection 9", latitude: 14.59745, longitude: 121.011341}, // Intersection around PUP Chapel, near Main Dome
        {id: 'CHI10', name: "Chapel Intersection 10", latitude: 14.596739, longitude: 121.011408}, // Intersection around PUP Chapel, near East Wing

        // Main Building: East Wing
        {id: 'EWI1', name: "East Wing Intersection 1", latitude: 14.596641, longitude: 121.011419}, // Intersection near East Wing
        {id: 'EWI2', name: "East Wing Intersection 2", latitude: 14.596572, longitude: 121.011379}, // Intersection near East Wing

        // Main Building: South Wing
        {id: 'SWI1', name: "South Wing Intersection 1", latitude: 14.596248, longitude: 121.011029}, // Intersection between South and East Wing
        {id: 'SWI2', name: "South Wing Intersection 2", latitude: 14.596443, longitude: 121.010309}, // Intersection southwest corner of South Wing
        {id: 'SWI3', name: "South Wing Intersection 3", latitude: 14.596589, longitude: 121.010247}, // Intersection between South and West Wing

        // Main Building: West Wing
        {id: 'WWI1', name: "West Wing Intersection 1", latitude: 14.59677, longitude: 121.010064}, // Intersection near West Wing
        {id: 'WWI2', name: "West Wing Intersection 2", latitude: 14.596958, longitude: 121.010001}, // Intersection near Student Canteen to PUP Auditorium
        {id: 'WWI3', name: "West Wing Intersection 3", latitude: 14.597032, longitude: 121.00998}, // Intersection near Student Canteen to PUP Auditorium

        // Court Intersection
        {id: 'CI1', name: "Court Intersection 1", latitude: 14.598488, longitude: 121.010958}, // Intersection inside courts 
        {id: 'CI2', name: "Court Intersection 2", latitude: 14.598787, longitude: 121.011261}, // Intersection in Tennis Court
        
        // Intersection near Gym
        {id: 'GI1', name: "Gym Intersection 1", latitude: 14.59881, longitude: 121.01066}, // Intersection to Gym
        {id: 'GI2', name: "Gym Intersection 2", latitude: 14.599128, longitude: 121.010386}, // Intersection near Gym
        {id: 'GI3', name: "Gym Intersection 3", latitude: 14.599252, longitude: 121.011148}, // Intersection near Gym

        // Intersection near PE Building
        {id: 'PEI1', name: "PE Building Intersection 1", latitude: 14.598391, longitude: 121.010362}, // Intersection to PE Building and Swimming Pool
        {id: 'PEI2', name: "PE Building Intersection 2", latitude: 14.598386, longitude: 121.010231}, // Intersection near PE Building
        {id: 'PEI3', name: "PE Building Intersection 3", latitude: 14.598485, longitude: 121.010338}, // Intersection near Swimmming Pool

        // Pool
        {id: 'SPI1', name: "Swimming Pool Intersection 1", latitude: 14.599029, longitude: 121.01044}, // Intersection inside Pool Area
        {id: 'SPI2', name: "Swimming Pool Intersection 2", latitude: 14.598832, longitude: 121.010608}, // Intersection inside Pool Area
        {id: 'SPI3', name: "Swimming Pool Intersection 3", latitude: 14.598532, longitude: 121.010252}, // Intersection inside Pool Area
        {id: 'SPI4', name: "Swimming Pool Intersection 4", latitude: 14.598731, longitude: 121.010074}, // Intersection inside Pool Area

        // PUP Obelisk
        {id: 'OBL1', name: "Obelisk Intersection 1", latitude: 14.598053, longitude: 121.010771}, // Intersection, Lagoon
        {id: 'OBL2', name: "Obelisk Intersection 2", latitude: 14.598068, longitude: 121.010644}, // Intersection around PUP Obelisk
        {id: 'OBL3', name: "Obelisk Intersection 3", latitude: 14.597988, longitude: 121.010778}, // Intersection around PUP Obelisk
        {id: 'OBL4', name: "Obelisk Intersection 4", latitude: 14.598126, longitude: 121.010929}, // Intersection around PUP Obelisk
        {id: 'OBL5', name: "Obelisk Intersection 5", latitude: 14.598304, longitude: 121.01075}, // Intersection around PUP Obelisk
        {id: 'OBL6', name: "Obelisk Intersection 6", latitude: 14.598231, longitude: 121.010633}, // Intersection around PUP Obelisk
        {id: 'OBL7', name: "Obelisk Intersection 7", latitude: 14.598254, longitude: 121.010892}, // Intersection near PUP Obelisk
        {id: 'OBL8', name: "Obelisk Intersection 8", latitude: 14.598265, longitude: 121.010565}, // Intersection to PE Building

        // lagoon
        {id: 'LAGI1', name: "Lagoon Intersection 1", latitude: 14.597364, longitude: 121.010034}, // Intersection, Lagoon
        {id: 'LAGI2', name: "Lagoon Intersection 2", latitude: 14.597351, longitude: 121.010055}, // Intersection, Lagoon
        {id: 'LAGI3', name: "Lagoon Intersection 3", latitude: 14.597257, longitude: 121.010186}, // Intersection, Lagoon
        {id: 'LAGI4', name: "Lagoon Intersection 4", latitude: 14.597222, longitude: 121.010239}, // Intersection, Lagoon
        {id: 'LAGI5', name: "Lagoon Intersection 5", latitude: 14.597149, longitude: 121.010378}, // Intersection, Lagoon
        {id: 'LAGI6', name: "Lagoon Intersection 6", latitude: 14.597192, longitude: 121.010541}, // Intersection, Lagoon
        {id: 'LAGI7', name: "Lagoon Intersection 7", latitude: 14.597322, longitude: 121.0106}, // Intersection, Lagoon
        {id: 'LAGI8', name: "Lagoon Intersection 8", latitude: 14.597709, longitude: 121.01071}, // Intersection, Lagoon
        {id: 'LAGI9a', name: "Lagoon Intersection 9A", latitude: 14.597865, longitude: 121.010689}, // Intersection, Lagoon
        {id: 'LAGI9b', name: "Lagoon Intersection 9B", latitude: 14.597924, longitude: 121.010633}, // Intersection, Lagoon
        {id: 'LAGI10', name: "Lagoon Intersection 10", latitude: 14.598001, longitude: 121.010561}, // Intersection, Lagoon
        {id: 'LAGI11', name: "Lagoon Intersection 11", latitude: 14.598132, longitude: 121.010452}, // Intersection, Lagoon
        {id: 'LAGI12', name: "Lagoon Intersection 12", latitude: 14.5981, longitude: 121.01036}, // Intersection, Lagoon
        {id: 'LAGI13', name: "Lagoon Intersection 13", latitude: 14.598052, longitude: 121.010216}, // Intersection, Lagoon
        {id: 'LAGI14', name: "Lagoon Intersection 14", latitude: 14.598018, longitude: 121.010123}, // Intersection, Lagoon
        {id: 'LAGI15', name: "Lagoon Intersection 15", latitude: 14.597901, longitude: 121.010073}, // Intersection, Lagoon
        {id: 'LAGI16', name: "Lagoon Intersection 16", latitude: 14.597838, longitude: 121.010142}, // Intersection, Lagoon
        {id: 'LAGI17', name: "Lagoon Intersection 17", latitude: 14.597789, longitude: 121.010239}, // Intersection, Lagoon
        {id: 'LAGI18', name: "Lagoon Intersection 18", latitude: 14.597707, longitude: 121.010229}, // Intersection, Lagoon
        {id: 'LAGI19', name: "Lagoon Intersection 19", latitude: 14.597598, longitude: 121.010154}, // Intersection, Lagoon
        {id: 'LAGI20', name: "Lagoon Intersection 20", latitude: 14.597471, longitude: 121.010162}, // Intersection, Lagoon
        {id: 'LAGI21', name: "Lagoon Intersection 21", latitude: 14.597367, longitude: 121.01028}, // Intersection, Lagoon
        {id: 'LAGI22', name: "Lagoon Intersection 22", latitude: 14.597422, longitude: 121.010392}, // Intersection, Lagoon
        {id: 'LAGI23', name: "Lagoon Intersection 23", latitude: 14.597354, longitude: 121.010519}, // Intersection, Lagoon
        {id: 'LAGI24', name: "Lagoon Intersection 24", latitude: 14.597371, longitude: 121.01054}, // Intersection, Lagoon
        {id: 'LAGI25', name: "Lagoon Intersection 25", latitude: 14.597362, longitude: 121.010569}, // Intersection, Lagoon
        {id: 'LAGI26', name: "Lagoon Intersection 26", latitude: 14.597336, longitude: 121.010573}, // Intersection, Lagoon
        {id: 'LAGI27', name: "Lagoon Intersection 27", latitude: 14.59751, longitude: 121.010544}, // Intersection, Lagoon
        {id: 'LAGI28', name: "Lagoon Intersection 28", latitude: 14.597683, longitude: 121.010605}, // Intersection, Lagoon
        {id: 'LAGI29', name: "Lagoon Intersection 29", latitude: 14.597706, longitude: 121.010609}, // Intersection, Lagoon
        {id: 'LAGI30', name: "Lagoon Intersection 30", latitude: 14.597727, longitude: 121.010613}, // Intersection, Lagoon
        {id: 'LAGI31', name: "Lagoon Intersection 31", latitude: 14.597763, longitude: 121.010462}, // Intersection, Lagoon
        {id: 'LAGI32', name: "Lagoon Intersection 32", latitude: 14.597644, longitude: 121.010446}, // Intersection, Lagoon
        {id: 'LAGI33', name: "Lagoon Intersection 33", latitude: 14.597726, longitude: 121.010426}, // Intersection, Lagoon
        {id: 'LAGI34', name: "Lagoon Intersection 34", latitude: 14.597846, longitude: 121.010549}, // Intersection, Lagoon
        {id: 'LAGI35', name: "Lagoon Intersection 35", latitude: 14.597883, longitude: 121.010373}, // Intersection, Lagoon
        {id: 'LAGI36', name: "Lagoon Intersection 36", latitude: 14.597951, longitude: 121.010372}, // Intersection, Lagoon
        {id: 'LAGI37', name: "Lagoon Intersection 37", latitude: 14.597927, longitude: 121.010484}, // Intersection, Lagoon
        {id: 'LAGI38', name: "Lagoon Intersection 38", latitude: 14.597988, longitude: 121.01045}, // Intersection, Lagoon
        {id: 'LAGI39', name: "Lagoon Intersection 39", latitude: 14.598011, longitude: 121.010357}, // Intersection, Lagoon
        {id: 'LAGI40', name: "Lagoon Intersection 40", latitude: 14.598044, longitude: 121.0103}, // Intersection, Lagoon

        // Ninoy Aquino LRC
        {id: 'NALRCI1', name: "Ninoy Aquino LRC Intersection 1", latitude: 14.597423, longitude: 121.009847}, // Intersection, Ninoy Aquino LRC
        {id: 'NALRCI2', name: "Ninoy Aquino LRC Intersection 2", latitude: 14.597647, longitude: 121.009776}, // Intersection, Ninoy Aquino LRC
        {id: 'NALRCI3', name: "Ninoy Aquino LRC Intersection 3", latitude: 14.597744, longitude: 121.009572}, // Intersection, Ninoy Aquino LRC
        {id: 'NALRCI4', name: "Ninoy Aquino LRC Intersection 4", latitude: 14.597665, longitude: 121.009366}, // Intersection, Ninoy Aquino LRC
        {id: 'NALRCI5', name: "Ninoy Aquino LRC Intersection 5", latitude: 14.597743, longitude: 121.009183}, // Intersection, Ninoy Aquino LRC
        {id: 'NALRCI6', name: "Ninoy Aquino LRC Intersection 6", latitude: 14.597545, longitude: 121.009604}, // Intersection, Ninoy Aquino LRC
        {id: 'NALRCI7', name: "Ninoy Aquino LRC Intersection 7", latitude: 14.598183, longitude: 121.009381}, // Intersection, Ninoy Aquino LRC
        {id: 'NALRCI8', name: "Ninoy Aquino LRC Intersection 8", latitude: 14.598121, longitude: 121.010128}, // Intersection near PE Building
        {id: 'NALRCI9', name: "Ninoy Aquino LRC Intersection 9", latitude: 14.598246, longitude: 121.010087}, // Intersection near PE Building
        {id: 'NALRCI10', name: "Ninoy Aquino LRC Intersection 10", latitude: 14.598351, longitude: 121.009847}, // Intersection near PE Building
        {id: 'NALRCI11', name: "Ninoy Aquino LRC Intersection 11", latitude: 14.598036, longitude: 121.009696}, // Intersection near PE Building

        // Laboratory High School
        {id: 'LHSI1', name: "LHS Intersection 1", latitude: 14.597097, longitude: 121.009061}, // Intersection inside Pool Area
        {id: 'LHSI2', name: "LHS Intersection 2", latitude: 14.597192, longitude: 121.009399}, // Intersection inside Pool Area
        {id: 'LHSI3', name: "LHS Intersection 3", latitude: 14.597411, longitude: 121.009336}, // Intersection inside Pool Area
        {id: 'LHSI4', name: "LHS Intersection 4", latitude: 14.597366, longitude: 121.009158}, // Intersection inside Pool Area
        {id: 'LHSI5', name: "LHS Intersection 5", latitude: 14.5977, longitude: 121.009061}, // Intersection inside Pool Area

        // Property Building and Motorpool Office
        {id: 'PBMOI1', name: "PBMO Intersection 1", latitude: 14.597686, longitude: 121.008966}, // Intersection to Property Building and Motorpool Office
        {id: 'PBMOI2', name: "PBMO Intersection 2", latitude: 14.597419, longitude: 121.008734}, // Intersection near Property Building and Motorpool Office
    ];

    // Edges
    var edges = [
        // Oval: Grandstand, CommunityBuilding, OvalE1, OvalE2
        ['Oval', 'Grandstand'], 
        ['Oval', 'CommunityBuilding'],
        ['Oval', 'OvalE1'],
        ['Oval', 'OvalE2'],
        ['CommunityBuilding', 'OvalE1'],
        ['CommunityBuilding', 'OvalE2'],
        ['Oval', 'OvalE1'],
        ['Oval', 'OvalE2'],
        ['MainGate', 'OvalE1'],
        ['MainGate', 'InfoCenter'],
        ['MainGate', 'I1'],
        ['InfoCenter', 'I1'],
        ['InfoCenter', 'OvalE1'],
        ['I1', 'GI3'],
        ['AMShrine', 'AMSE'],
        ['AMShrine', 'AME'],
        ['AMMuseum', 'AMME'],
        ['AMME', 'AME'],
        // I1: I2, 
        ['I1', 'I2'],

        // I2: I1, Souvenir, I3
        ['I2', 'Souvenir'],
        ['I2', 'I3'],

        // I3: I2, CHI1
        ['I3', 'CHI1'],
        
        // B1E: GI3, Gate2
        ['B1E', 'Gate2'],

        // B1: B1E
        ['B1', 'B1E'],

        // Gymnasium: GE1, GE2, GE3
        ['Gymnasium', 'GE1'],
        ['Gymnasium', 'GE2'],
        ['Gymnasium', 'GE3'],

        // GE1: GI3, B1E
        ['GE1', 'B1E'],

        // GE2: GE3, GI1, GI3

        // GE3: GI1, GE2, GI3
        ['GE3', 'GI1'],
        ['GE3', 'GE2'],
        ['GE3', 'GI3'],

        // GI3: GI1, GE2, GE1, B1E, I1, GE3
        ['GI3', 'GE2'],
        ['GI3', 'GE1'],
        ['GI3', 'B1E'],
        ['GI3', 'I1'],

        // CI2: CI1
        ['CI2', 'CI1'],

        // CI1: OBL5, OBL7, CI2
        ['CI1', 'OBL5'],
        ['CI1', 'OBL7'],

        // GI1: PEI3, GI2, GI3, GE1, GE2, GE3
        ['GI1', 'GI3'],
        ['GI1', 'GE1'],
        ['GI1', 'GE2'],
        ['GI1', 'GE3'],

        // GI2: GI1
        ['GI2', 'GI1'],

        // PEI1: OBL8, PEI2, PEI3
        ['PEI1', 'PEI2'],
        ['PEI1', 'PEI3'],

        // SE: PEI1, PEI2, SPI3, SPI2, TahananAlumni, PE
        ['SE', 'SPI2'],
        ['SE', 'TahananAlumni'],
        ['SE', 'PE'],

        // SPI1: SPI2, SPI4, Pool

        // SPI2: SPI3, SPI1
        ['SPI2', 'SPI1'],

        // SPI3: SE, SPI2, SPI4
        ['SPI3', 'SE'],
        ['SPI3', 'SPI2'],

        // SPI4: SPI3, SPI1, Pool
        ['SPI4', 'SPI3'],
        ['SPI4', 'SPI1'],

        // Pool: SPI1, SPI4
        ['Pool', 'SPI1'],
        ['Pool', 'SPI4'],

        // PEI2: PEI1, PE, TahananAlumni, SE
        ['PEI2', 'PEI1'],
        ['PEI2', 'PE'],
        ['PEI2', 'TahananAlumni'],
        ['PEI2', 'SE'],

        // PEI3: PEI1, PE, TahananAlumni, SE, GI1
        ['PEI3', 'PEI1'],
        ['PEI3', 'PE'],
        ['PEI3', 'TahananAlumni'],
        ['PEI3', 'SE'],
        ['PEI3', 'GI1'],

        // OBL8: NALRCI8, OBL6, PEI1
        ['OBL8', 'NALRCI8'],
        ['OBL8', 'PEI1'],

        // OBL7: OBL4, OBL5, CI1, Souvenir, I1
        ['OBL7', 'CI1'],
        ['OBL7', 'Souvenir'],
        ['OBL7', 'I1'],

        // OBL6: OBL2, OBL5, OBL8
        ['OBL6', 'OBL8'],

        // OBL5: OBL6, OBL7
        ['OBL5', 'OBL6'],
        ['OBL5', 'OBL7'],

        // OBL4: OBL3, OBL7, AME
        ['OBL4', 'OBL7'],
        ['OBL4', 'AME'], 
        
        // OBL3: LAGE1, OBL1, OBL2, OBL4
        ['OBL3', 'OBL4'],
        
        // OBL2: LAGE1, OBL1, OBL3, OBL6
        ['OBL2', 'OBL3'],
        ['OBL2', 'OBL6'],

        // OBL1: LAGE1, OBL2, OBL3
        ['OBL1', 'OBL2'],
        ['OBL1', 'OBL3'],

        // LAGE1: LAGI9b, OBL1, OBL2, OBL3
        ['LAGE1', 'LAGI9b'],
        ['LAGE1', 'OBL1'],
        ['LAGE1', 'OBL2'],
        ['LAGE1', 'OBL3'],

        // LAGI40: LAGI39, LAGI13

        // LAGI39: LAGI36, LAGI40
        ['LAGI39', 'LAGI40'],

        // LAGI38: LAGI37, LAGI12

        // LAGI37: LAGI38, LAGI10
        ['LAGI37', 'LAGI38'],

        // LAGI36: LAGI35, LAGI37, LAGI39
        ['LAGI36', 'LAGI37'],
        ['LAGI36', 'LAGI39'],

        // LAGI35: LAGI33, LAGI36
        ['LAGI35', 'LAGI36'],

        // LAGI34: LAGI31, LAGI37, LAGI9b 
        ['LAGI34', 'LAGI37'],

        // LAGI33: LAGI31, LAGI32, LAGI35
        ['LAGI33', 'LAGI35'],

        // LAGI32: LAGI22, LAGI33
        ['LAGI32', 'LAGI33'],

        // LAGI31: LAGI30, LAGI33, LAGI34
        ['LAGI31', 'LAGI33'],
        ['LAGI31', 'LAGI34'],

        // LAGI30: LAGI29, LAGI31
        ['LAGI30', 'LAGI31'],

        // LAGI29: LAGI28, LAGI30
        ['LAGI29', 'LAGI30'],
        
        // LAGI28: LAGI27, LAGI29
        ['LAGI28', 'LAGI29'],

        // LAGI27: LAGI25, LAGI28
        ['LAGI27', 'LAGI28'],

        // LAGI26: LAGI7, LAGI25
        ['LAGI26', 'LAGI25'],

        // LAGI25: LAGI26, LAGI27, LAGI24
        ['LAGI25', 'LAGI26'],
        ['LAGI25', 'LAGI27'],

        // LAGI24: LAGI25, LAGI23
        ['LAGI24', 'LAGI25'],

        // LAGI23: LAGI24, LAGI22
        ['LAGI23', 'LAGI24'],

        // LAGI22: LAGI4, LAGI23, LAGI32
        ['LAGI22', 'LAGI23'],
        ['LAGI22', 'LAGI32'],

        // LAGI21: LAGI3, LAGI22
        ['LAGI21', 'LAGI22'],

        // LAGI20, LAGI2, LAGI21, LAGI19
        ['LAGI20', 'LAGI21'],

        // LAGI19: LAGI20, LAGI18
        ['LAGI19', 'LAGI20'],

        // LAGI18: LAGI19, LAGI17
        ['LAGI18', 'LAGI19'],

        // LAGI17: LAGI18, LAGI16
        ['LAGI17', 'LAGI18'],

        // LAGI16: LAGI17, LAGI15
        ['LAGI16', 'LAGI17'],

        // LAGI15: LAGI16, LAGI14
        ['LAGI15', 'LAGI16'],

        // LAGI14: LAGI15, LAGI13
        ['LAGI14', 'LAGI15'],

        // LAGI13: LAGI14, LAGI40, LAGI12
        ['LAGI13', 'LAGI14'],
        ['LAGI13', 'LAGI40'],

        // LAGI12: LAGI13, LAGI11, LAGI38
        ['LAGI12', 'LAGI13'],
        ['LAGI12', 'LAGI38'],

        // LAGI11: LAGI12, LAGI10
        ['LAGI11', 'LAGI12'],

        // LAGI10: LAGI11, LAGI9b, LAGI37
        ['LAGI10', 'LAGI11'],
        ['LAGI10', 'LAGI37'],

        // LAGI9b: LAGI10, LAGI34, LAGI9a, LAGE1
        ['LAGI9b', 'LAGI10'],
        ['LAGI9b', 'LAGI34'],
        
        // LAGI9a: LAGI8, LAGI9b
        ['LAGI9a', 'LAGI9b'],

        // LAGI8: LAGI7, LAGI9a
        ['LAGI8', 'LAGI9a'],

        // LAGI7: LAGI6, LAGI26, LAGI8
        ['LAGI7', 'LAGI26'],
        ['LAGI7', 'LAGI8'],

        // LAGI6: LAGI5, LAGI7
        ['LAGI6', 'LAGI7'],

        // LAGI5: LAGI4, LAGI6
        ['LAGI5', 'LAGI6'],

        // LAGI4: LAGI3, LAGI22, LAGI5
        ['LAGI4', 'LAGI22'],
        ['LAGI4', 'LAGI5'],

        // LAGI3: LAGI2, LAGI21, LAGI4
        ['LAGI3', 'LAGI21'],
        ['LAGI3', 'LAGI4'],
        
        // LAGI2: LAGI1, LAGI20, LAGI3
        ['LAGI2', 'LAGI20'],
        ['LAGI2', 'LAGI3'],

        // LAGI1: LAGE2, LAGI2
        ['LAGI1', 'LAGI2'],

        // LAGE2: NALRCI1, TMBI3, LAGI1
        ['LAGE2', 'LAGI1'],

        // TMBI3: TMBI1, LAGE2
        ['TMBI3', 'LAGE2'],
        
        // TMBI1: TMBI3, TMBI2, WWI3
        ['TMBI1', 'TMBI3'],
        ['TMBI1', 'WWI3'],

        // TMBI2: TMBI1, WWI2
        ['TMBI2', 'TMBI1'],
        ['TMBI2', 'WWI2'],

        // PS: WWI1, SWI3, SWI2
        ['PS', 'WWI1'],
        ['PS', 'SWI3'],
        ['PS', 'SWI2'],

        // SCE: WWI3, WWI2
        ['SCE', 'WWI2'],
        ['SCE', 'WWI3'],

        // SB: WWI2, WWI1
        ['SB', 'WWI2'],
        ['SB', 'WWI1'],

        // WWWI3:

        // NALRCI1: NALRCI2, NACLRCI6, PKE, WWI3, LAGE2
        ['NALRCI1', 'PKE'],
        ['NALRCI1', 'WWI3'],
        ['NALRCI1', 'LAGE2'],

        // NALRCI9: NALRCI10, NALRCI8
        ['NALRCI9', 'NALRCI8'],

        // NALRCI10: NALRCI11, NALRCI9, B2
        ['NALRCI10', 'NALRCI9'],
        ['NALRCI10', 'B2'],

        // NALRCI11: NALRCI7, NALRCI10, B2
        ['NALRCI11', 'NALRCI10'],
        ['NALRCI11', 'B2'],

        // NALRCI7: NALRCI5, NALRCI11 
        ['NALRCI7', 'NALRCI11'],

        // NALRCE: NALRCI2, NALRCI3, NALRCI6
        ['NALRCE', 'NALRCI2'],
        ['NALRCE', 'NALRCI3'],
        ['NALRCE', 'NALRCI6'],

        // MT: NALRCI3, NALRCI4, NALRCI5
        ['MT', 'NALRCI3'],
        ['MT', 'NALRCI4'],
        ['MT', 'NALRCI5'],

        // NALRCI3: NALRCE, NALRCI4
        ['NALRCI3', 'NALRCI4'],

        // NALRCI4: NALRCI3, NALRCI5, NALRCI6
        ['NALRCI4', 'NALRCI5'],
        ['NALRCI4', 'NALRCI6'],

        // NALRCI5: NALRCI4, LHSI5, PBMOI1, NALRCI7
        ['NALRCI5', 'PBMOI1'],
        ['NALRCI5', 'LHSI5'],
        ['NALRCI5', 'NALRCI7'],

        ['LHSI1', 'LHSE1'],
        ['LHSI1', 'LHSI2'],
        ['LHSE5', 'LHSI1'],
        ['LHSE5', 'LHSI2'],
        ['LHSI2', 'LHSI3'],
        ['LHSI3', 'LHSE4'],
        ['LHSI4', 'LHSE4'],
        ['LHSE3', 'LHSE4'],
        ['LHSE2', 'LHSE3'],
        ['LHSI4', 'LHSE3'],
        ['LHSI4', 'LHSE2'],
        ['LHSI5', 'LHSI4'],
        ['LHSI5', 'LHSE2'],
        ['LHSI5', 'LHSE1'],
        ['PBMOI1', 'LHSI5'],
        ['PBMOI1', 'LHSE1'],
        ['PBMOI1', 'PBMOI2'],
        ['PBMOI2', 'PBMO'],
        ['PBMOI2', 'PO']
    ]

    // Add the initialized vertices
    // Adds all the elements of the vertices array to the graph using the function addVertex
    for (var i = 0; i < vertices.length; i++) {
        // Gets the x and y of specific vertex
        var converted = convertGeo(vertices[i].latitude, vertices[i].longitude, mapWidth, mapHeight, leftLong, rightLong, latBottom);

        // Adds vertices 
        campus_map.addVertex(
            vertices[i].id,
            vertices[i].latitude,
            vertices[i].longitude,
            converted.x,
            converted.y,
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

    // Test the main function
    console.log(campus_map.printCampusMap());
    
    // Markers for nodes
    vertices.forEach(vertice => {
        var current = L.marker([vertice.latitude, vertice.longitude]);
        current.addTo(map).bindPopup(vertice.name);
    })
});