/**
 * Binary Min-Heap Priority Queue
 * Time Complexity:
 * - Enqueue: O(log n)
 * - Dequeue (Extract-Min): O(log n)
 * - Peek: O(1)
 * Space Complexity: O(n)
 */

export interface HeapNode<T> {
  element: T;
  priority: number;
}

export class PriorityQueue<T> {
  private heap: HeapNode<T>[] = [];

  public size(): number {
    return this.heap.length;
  }

  public isEmpty(): boolean {
    return this.heap.length === 0;
  }

  public peek(): HeapNode<T> | null {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  public enqueue(element: T, priority: number): void {
    const node: HeapNode<T> = { element, priority };
    this.heap.push(node);
    this.bubbleUp(this.heap.length - 1);
  }

  public dequeue(): HeapNode<T> | null {
    if (this.isEmpty()) return null;
    const min = this.heap[0];
    const end = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = end;
      this.sinkDown(0);
    }
    return min;
  }

  private bubbleUp(index: number): void {
    const node = this.heap[index];
    while (index > 0) {
      const parentIdx = Math.floor((index - 1) / 2);
      const parent = this.heap[parentIdx];
      if (node.priority >= parent.priority) break;
      this.heap[index] = parent;
      index = parentIdx;
    }
    this.heap[index] = node;
  }

  private sinkDown(index: number): void {
    const length = this.heap.length;
    const node = this.heap[index];

    while (true) {
      const leftChildIdx = 2 * index + 1;
      const rightChildIdx = 2 * index + 2;
      let swapIdx: number | null = null;
      let leftChild: HeapNode<T> | undefined;
      let rightChild: HeapNode<T> | undefined;

      if (leftChildIdx < length) {
        leftChild = this.heap[leftChildIdx];
        if (leftChild.priority < node.priority) {
          swapIdx = leftChildIdx;
        }
      }

      if (rightChildIdx < length) {
        rightChild = this.heap[rightChildIdx];
        if (
          (swapIdx === null && rightChild.priority < node.priority) ||
          (swapIdx !== null && leftChild && rightChild.priority < leftChild.priority)
        ) {
          swapIdx = rightChildIdx;
        }
      }

      if (swapIdx === null) break;
      this.heap[index] = this.heap[swapIdx];
      index = swapIdx;
    }
    this.heap[index] = node;
  }
}
