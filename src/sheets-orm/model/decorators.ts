import { BaseModel } from './BaseModel'
import type { HookType } from '../types/ModelTypes'

/**
 * Column decorator
 */
export function column(options: any = {}): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const constructor = target.constructor as typeof BaseModel
    constructor.registerColumn(propertyKey as string, options)
  }
}

/**
 * DateTime column with auto behaviors
 */
column.dateTime = (options: { autoCreate?: boolean, autoUpdate?: boolean } = {}) => {
  return column({
    type: 'dateTime',
    ...options
  })
}

/**
 * Hook decorators
 */
function createHookDecorator(hookType: HookType) {
  return (): MethodDecorator => {
    return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
      // Instance methods receive the prototype; static methods receive the constructor.
      const constructor = typeof target === 'function' ? target : target.constructor

      if (typeof constructor.registerHook === 'function') {
        constructor.registerHook(hookType, descriptor.value)
      }

      return descriptor
    }
  }
}

export const beforeCreate = createHookDecorator('beforeCreate')
export const afterCreate = createHookDecorator('afterCreate')
export const beforeUpdate = createHookDecorator('beforeUpdate')
export const afterUpdate = createHookDecorator('afterUpdate')
export const beforeSave = createHookDecorator('beforeSave')
export const afterSave = createHookDecorator('afterSave')
export const beforeDelete = createHookDecorator('beforeDelete')
export const afterDelete = createHookDecorator('afterDelete')
export const beforeFind = createHookDecorator('beforeFind')
export const afterFind = createHookDecorator('afterFind')

/**
 * Relationship decorators
 */
export function hasMany(
  model: () => typeof BaseModel,
  options: { foreignKey: string, localKey?: string } = { foreignKey: '' }
): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const constructor = target.constructor as typeof BaseModel
    constructor.registerRelation(propertyKey as string, {
      type: 'hasMany',
      model,
      foreignKey: options.foreignKey,
      localKey: options.localKey
    })

    // Define getter to access relation from $relations
    Object.defineProperty(target, propertyKey, {
      get(this: BaseModel) {
        return (this as any).getRelation(propertyKey as string) || []
      },
      enumerable: true,
      configurable: true
    })
  }
}

export function belongsTo(
  model: () => typeof BaseModel,
  options: { foreignKey: string, ownerKey?: string } = { foreignKey: '' }
): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const constructor = target.constructor as typeof BaseModel
    constructor.registerRelation(propertyKey as string, {
      type: 'belongsTo',
      model,
      foreignKey: options.foreignKey,
      ownerKey: options.ownerKey
    })

    // Define getter to access relation from $relations
    Object.defineProperty(target, propertyKey, {
      get(this: BaseModel) {
        return (this as any).getRelation(propertyKey as string) || null
      },
      enumerable: true,
      configurable: true
    })
  }
}

export function hasOne(
  model: () => typeof BaseModel,
  options: { foreignKey: string, localKey?: string } = { foreignKey: '' }
): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const constructor = target.constructor as typeof BaseModel
    constructor.registerRelation(propertyKey as string, {
      type: 'hasOne',
      model,
      foreignKey: options.foreignKey,
      localKey: options.localKey
    })

    // Define getter to access relation from $relations
    Object.defineProperty(target, propertyKey, {
      get(this: BaseModel) {
        return (this as any).getRelation(propertyKey as string) || null
      },
      enumerable: true,
      configurable: true
    })
  }
}

export function manyToMany(
  model: () => typeof BaseModel,
  options: {
    pivotTable: string,
    foreignKey: string,
    relatedKey: string,
    localKey?: string,
    relatedLocalKey?: string
  }
): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const constructor = target.constructor as typeof BaseModel
    constructor.registerRelation(propertyKey as string, {
      type: 'manyToMany',
      model,
      pivotTable: options.pivotTable,
      foreignKey: options.foreignKey,
      relatedPivotKey: options.relatedKey,
      localKey: options.localKey,
      ownerKey: options.relatedLocalKey
    })

    // Define getter to access relation from $relations
    Object.defineProperty(target, propertyKey, {
      get(this: BaseModel) {
        return (this as any).getRelation(propertyKey as string) || []
      },
      enumerable: true,
      configurable: true
    })
  }
}
