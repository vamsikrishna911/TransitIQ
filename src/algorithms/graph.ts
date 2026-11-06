import { TransitStop, TransitConnection } from '../types/transit';

export interface GraphEdge {
  node: string;
  distanceKm: number;
  timeMin: number;
  fareInr: number;
  mode: 'bus' | 'walking' | 'mixed';
}

/**
 * Adjacency List Graph representation for a Multimodal Transportation Network.
 * Space Complexity: O(|V| + |E|)
 * Edge Retrieval: O(degree(V))
 */
export class TransitGraph {
  private adjacencyList: Map<string, GraphEdge[]> = new Map();
  private stops: Map<string, TransitStop> = new Map();

  constructor(stops: TransitStop[] = [], connections: TransitConnection[] = []) {
    this.populate(stops, connections);
  }

  public populate(stops: TransitStop[], connections: TransitConnection[]): void {
    this.adjacencyList.clear();
    this.stops.clear();

    for (const stop of stops) {
      this.addStop(stop);
    }

    for (const edge of connections) {
      this.addEdge(edge.from, edge.to, edge.distanceKm, edge.timeMin, edge.fareInr, edge.mode, true);
    }
  }

  public addStop(stop: TransitStop): void {
    if (!this.stops.has(stop.id)) {
      this.stops.set(stop.id, { ...stop });
      this.adjacencyList.set(stop.id, []);
    }
  }

  public addEdge(
    fromId: string,
    toId: string,
    distanceKm: number,
    timeMin: number,
    fareInr: number,
    mode: 'bus' | 'walking' | 'mixed' = 'bus',
    bidirectional: boolean = true
  ): void {
    if (!this.adjacencyList.has(fromId) || !this.adjacencyList.has(toId)) return;

    this.adjacencyList.get(fromId)!.push({
      node: toId,
      distanceKm: Number(distanceKm),
      timeMin: Number(timeMin),
      fareInr: Number(fareInr),
      mode
    });

    if (bidirectional) {
      this.adjacencyList.get(toId)!.push({
        node: fromId,
        distanceKm: Number(distanceKm),
        timeMin: Number(timeMin),
        fareInr: Number(fareInr),
        mode
      });
    }
  }

  public getStop(id: string): TransitStop | undefined {
    return this.stops.get(id);
  }

  public getAllStops(): TransitStop[] {
    return Array.from(this.stops.values());
  }

  public getNeighbors(id: string): GraphEdge[] {
    return this.adjacencyList.get(id) || [];
  }

  public getDegree(id: string): number {
    return (this.adjacencyList.get(id) || []).length;
  }
}
