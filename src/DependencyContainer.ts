export default class DependencyContainer {
  private static instance: DependencyContainer;
  private dependencies: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): DependencyContainer {
    if (!DependencyContainer.instance) {
      DependencyContainer.instance = new DependencyContainer();
    }
    return DependencyContainer.instance;
  }

  public register(key: string, instance: any): void {
    this.dependencies.set(key, new instance());
  }

  public resolve<T>(key: string): T {
    const dependency = this.dependencies.get(key);
    if (dependency) {
      return dependency as T;
    }
    throw new Error(`Dependency ${key} not found.`);
  }
}