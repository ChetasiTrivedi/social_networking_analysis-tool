// Data structure to hold nodes and links
const networkData = {
    nodes: [],
    links: []
};

// Function to load data from SWAPI and populate the network graph
async function loadSWAPIData() {
    try {
        const totalPages = 3;
        for (let page = 1; page <= totalPages; page++) {
            const response = await fetch(`https://swapi.dev/api/people/?page=${page}`);
            const data = await response.json();

            data.results.forEach((person) => {
                networkData.nodes.push({ id: person.name });
            });
        }

        createComplexLinks();
        visualizeNetwork();
    } catch (error) {
        console.error("Error fetching SWAPI data:", error);
    }
}

// Function to create links between nodes
function createComplexLinks() {
    const nodeCount = networkData.nodes.length;
    networkData.links = [];

    networkData.nodes.forEach((node, index) => {
        const numConnections = Math.floor(Math.random() * 3) + 2;

        for (let i = 0; i < numConnections; i++) {
            let targetIndex;
            do {
                targetIndex = Math.floor(Math.random() * nodeCount);
            } while (targetIndex === index || 
                     networkData.links.some(link => 
                        (link.source.id === node.id && link.target.id === networkData.nodes[targetIndex].id) || 
                        (link.target.id === node.id && link.source.id === networkData.nodes[targetIndex].id))
            );

            networkData.links.push({
                source: node.id,
                target: networkData.nodes[targetIndex].id
            });
        }
    });
}

// Find mutual friends between two selected nodes
function findMutualFriends() {
    
    const input1 = document.getElementById("username_1");
    const input2 = document.getElementById("username_2");
    const name1=input1.value;
    const name2=input2.value;
    console.log(name1 , name2);
    const connections1 = new Set(networkData.links
        .filter(link => link.source.id === name1 || link.target.id === name1)
        .map(link => link.source.id === name1 ? link.target.id : link.source.id));
        
    const connections2 = new Set(networkData.links
        .filter(link => link.source.id === name2 || link.target.id === name2)
        .map(link => link.source.id === name2 ? link.target.id : link.source.id));
    
    const mutualFriends = [...connections1].filter(friend => connections2.has(friend));
    
    const value = mutualFriends.length 
        ? `Mutual friends of ${name1} and ${name2}:   ${mutualFriends.join(", ")}` 
        : `No mutual friends found between ${name1} and ${name2}.`;
    const newParagraph = document.createElement("p");
    newParagraph.textContent = value;
    document.getElementById("output-content").appendChild(newParagraph);
    document.getElementById("output-content").style.backgroundColor="#f9f9f9";
    document.getElementById("output-content").style.border="1px solid #ddd";
    document.getElementById("output-content").style.textAlign="center";
}

// Detect communities (connected components)
function detectCommunities() {
    const visited = new Set();
    const communities = [];

    networkData.nodes.forEach(node => {
        if (!visited.has(node.id)) {
            const community = [];
            dfsCommunity(node.id, community, visited);
            communities.push(community);
        }
    });
    const value =   `Communities detected:\n${communities.map((c, i) => `Community ${i + 1}: ${c.join(", ")}`).join("\n")}`;

    const newParagraph = document.createElement("p");
    newParagraph.textContent = value;
    document.getElementById("output-content").appendChild(newParagraph);
    document.getElementById("output-content").style.backgroundColor="#f9f9f9";
    document.getElementById("output-content").style.border="1px solid #ddd";
    document.getElementById("output-content").style.textAlign="center";

  }

// Helper function for Depth-First Search (DFS)
function dfsCommunity(nodeId, community, visited) {
    visited.add(nodeId);
    community.push(nodeId);

    networkData.links.forEach(link => {
        const neighbor = link.source.id === nodeId ? link.target.id : link.source.id;
        if ((link.source.id === nodeId || link.target.id === nodeId) && !visited.has(neighbor)) {
            dfsCommunity(neighbor, community, visited);
        }
    });
}

// Find the most influential person (highest degree centrality)
function findMostInfluential() {
    const centralityScores = {};

    networkData.nodes.forEach(node => {
        centralityScores[node.id] = 0;
    });
    networkData.links.forEach(link => {
        centralityScores[link.source.id]++;
        centralityScores[link.target.id]++;
    });

    const mostInfluential = Object.keys(centralityScores).reduce((a, b) => 
        centralityScores[a] > centralityScores[b] ? a : b
    );
    document.getElementsByClassName("card-title")[0].textContent=(mostInfluential);
    document.getElementsByClassName("card-subtitle")[0].textContent=("with "+centralityScores[mostInfluential]+ "  connections");
    document.getElementsByClassName("maincard")[0].style.textAlign="center";
    document.getElementsByClassName("card")[0].style.border="2px solid #ddd";
    // alert(`Most Influential Person: ${mostInfluential} with ${centralityScores[mostInfluential]} connections.`);
}

// Function to display node information
function displayNodeInfo(node) {
    const connections = networkData.links
        .filter(link => link.source.id === node.id || link.target.id === node.id)
        .map(link => (link.source.id === node.id ? link.target.id : link.source.id));

    alert(`Character: ${node.id}\nConnections: ${connections.join(", ")}`);
}

// Visualize the network using D3.js
function visualizeNetwork() {
    const svg = d3.select("svg");
    svg.selectAll("*").remove();

    const width = +svg.attr("width");
    const height = +svg.attr("height");

    const simulation = d3.forceSimulation(networkData.nodes)
        .force("link", d3.forceLink(networkData.links).id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(networkData.links)
        .join("line")
        .attr("stroke-width", 2);

    const node = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll("circle")
        .data(networkData.nodes)
        .join("circle")
        .attr("r", 10)
        .attr("fill", "#69b3a2")
        .on("click", (event, d) => displayNodeInfo(d))
        .call(drag(simulation));

    const label = svg.append("g")
        .selectAll("text")
        .data(networkData.nodes)
        .join("text")
        .attr("x", 12)
        .attr("y", 3)
        .text(d => d.id);

    function drag(simulation) {
        return d3.drag()
            .on("start", event => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
            })
            .on("drag", event => {
                event.subject.fx = event.x;
                event.subject.fy = event.y;
            })
            .on("end", event => {
                if (!event.active) simulation.alphaTarget(0);
                event.subject.fx = null;
                event.subject.fy = null;
            });
    }

    simulation.on("tick", () => {
        link.attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node.attr("cx", d => d.x).attr("cy", d => d.y);
        label.attr("x", d => d.x + 12).attr("y", d => d.y + 3);
    });
}

// Event listeners for button functionalities
document.getElementById("mutual-friends-btn").addEventListener("click", findMutualFriends);
document.getElementById("communities-btn").addEventListener("click", detectCommunities);
document.getElementById("influential-btn").addEventListener("click", findMostInfluential);


// Load the data on page load
loadSWAPIData();
