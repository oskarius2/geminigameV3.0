export class Vector2 {
  constructor(public x: number = 0, public y: number = 0) {}

  add(v: Vector2): Vector2 {
    return new Vector2(this.x + v.x, this.y + v.y);
  }

  sub(v: Vector2): Vector2 {
    return new Vector2(this.x - v.x, this.y - v.y);
  }

  mul(n: number): Vector2 {
    return new Vector2(this.x * n, this.y * n);
  }

  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize(): Vector2 {
    const mag = this.magnitude();
    if (mag === 0) return new Vector2(0, 0);
    return new Vector2(this.x / mag, this.y / mag);
  }

  dist(v: Vector2): number {
    return Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2);
  }

  lerp(v: Vector2, t: number): Vector2 {
    return this.add(v.sub(this).mul(t));
  }

  distanceTo(v: Vector2): number {
    return this.dist(v);
  }

  distanceToSq(v: Vector2): number {
    return (this.x - v.x) ** 2 + (this.y - v.y) ** 2;
  }

  clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }
}
