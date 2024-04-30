export class Queue<T> {
  items: Record<number, T>;
  rear = 0;
  front = 0;
  constructor() {
    this.items = {};
  }

  enqueue(element: T) {
    this.items[this.rear] = element;
    this.rear++;
  }
  dequeue() {
    const item = this.items[this.front];
    delete this.items[this.front];
    this.front++;
    return item;
  }
  isEmpty() {
    return this.rear - this.front === 0;
  }
  peek(): T {
    return this.items[this.front];
  }
  size(): number {
    return this.rear - this.front;
  }
  print() {
    console.log(this.items);
  }
}
