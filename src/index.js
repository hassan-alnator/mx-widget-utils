/**
 * Get Items From List When Ready
 *
 * @name getItemsFromListWhenReady
 * @list Objects
 * @param data Entity type for the created object
 */
export const getItemsFromListWhenReady = (props, stateKey, isList = false, splitBy = false, modifier = false) => {

    return new Promise((resolve, reject) => {
        try {
            const dataLoaderInterval = setInterval(() => {
                const { status } = props;

                if (status === "available") {

                    clearInterval(dataLoaderInterval);

                    if (isList) {
                        this.loadItems(props.items, stateKey)
                            .then(_ => resolve(_));
                    } else {
                        let data = props.displayValue;

                        if (splitBy) {
                            data = data.split(splitBy);
                        }

                        if (modifier) {
                            data = modifier(data)
                        }

                        resolve(data)
                    }
                }
            }, 100)

        } catch (e) {
            reject(e)
        }
    })
}


/**
 * Get Items
 *
 * @name loadItems
 * @list Objects
 * @param list Entity type for the created object
 */
export const loadItems = async (list) => {

    const items = [];
    for (let index = 0; index < list.length; index++) {
        const item = list[index];
        const itemWithDate = await getObject(item.id);

        items.push({ ...itemWithDate, guid: item.id, index });
    }

    return { items }
}


/**
 * Create a Mendix Object
 *
 * @name createObject
 * @category Objects
 * @param entity Entity type for the created object
 */
export const createObject = (entity) =>
    new Promise((resolve, reject) => {
        window.mx.data.create({ entity, callback: resolve, error: reject });
    });

/**
 * Commit a Mendix Object
 *
 * @name commitObject
 * @category Objects
 * @param mxobj Mendix Object that will be committed to the server
 */
export const commitObject = (mxobj) =>
    new Promise((resolve, reject) => {
        window.mx.data.commit({ mxobj, callback: resolve, error: reject });
    });

/**
 * Delete a Mendix Object based on Guid
 *
 * @name deleteObjectGuid
 * @category Objects
 * @param guid Object guid of the deleted object
 */
export const deleteObjectGuid = (guid) =>
    new Promise((resolve, reject) => {
        window.mx.data.remove({ guid, callback: resolve, error: reject });
    });

/**
 * Delete a Mendix Object
 *
 * @name deleteObject
 * @category Objects
 * @param obj Mendix Object
 */
export const deleteObject = (obj) => {
    return deleteObjectGuid(obj.getGuid());
};

/**
 * Get a Mendix Object
 *
 * @name getObject
 * @category Objects
 * @param guid Object guid of the Mendix Object that you try to return
 */
export const getObject = (guid) =>
    new Promise((resolve, reject) => {
        window.mx.data.get({ guid, callback: resolve, error: reject });
    });

/**
 * Get a list of Mendix Objects
 *
 * @name getObjects
 * @category Objects
 * @param guid Object guid of the Mendix Object that you try to return
 */
export const getObjects = (guids, filter) =>
    new Promise((resolve, reject) => {
        const getOptions = { guids, callback: resolve, error: reject };

        if (filter) {
            getOptions.filter = filter;
        }

        window.mx.data.get(getOptions);
    });

/**
 * Fetch an attribute from a Mendix Object
 *
 * @name fetchAttr
 * @category Objects
 * @param obj Mendix Object
 * @param attr Attribute
 */
export const fetchAttr = (obj, attr) =>
    new Promise((resolve, reject) => {
        if (attr === "") {
            reject(new Error("Attribute to fetch cannot be empty!"));
        } else if (!obj.has(attr)) {
            reject(new Error(`Attribute '${attr}' does not exist on object of type ${obj.getEntity()}`));
        } else {
            try {
                obj.fetch(attr, resolve);
            } catch (error) {
                reject(error);
            }
        }
    });

/**
 * Get a formatted value from an attribute of a Mendix Object
 *
 * @name getFormattedValue
 * @category Objects
 * @param obj Mendix Object
 * @param attr Attribute
 */
export const getFormattedValue = (obj, attr) => {
    const type = obj.getAttributeType(attr);
    const ret = obj.get(attr);
    if (type === "Enum") {
        return obj.getEnumCaption(attr, ret);
    } else if (type === "Boolean") {
        return ret ? "True" : "False";
    } else if (type === "Date" || type === "DateTime") {
        return window.mx.parser.formatValue(ret, type.toLowerCase());
    }
    return ret.valueOf ? ret.valueOf() : ret;
};

/**
 * Get context for a Mendix Object, used in actions
 *
 * @name getObjectContext
 * @category Objects
 * @param obj Mendix Object
 */
export const getObjectContext = (obj) => {
    const context = new mendix.lib.MxContext();
    context.setContext(obj.getEntity(), obj.getGuid());
    return context;
};

/**
 * Get context from the first Mendix Object encountered
 *
 * @name getObjectContextFromObjects
 * @category Objects
 * @param objs Mendix Objects array
 */
// tslint:disable-next-line:array-type
export const getObjectContextFromObjects = (...objs) => {
    const context = new mendix.lib.MxContext();
    let contextCreated = false;
    objs.forEach((obj) => {
        if (!contextCreated && obj && obj.getGuid) {
            context.setContext(obj.getEntity(), obj.getGuid());
            contextCreated = true;
        }
    });
    return context;
};

/**
 * Get context from a guid and entityname
 *
 * @name getObjectContextFromId
 * @category Objects
 * @param guid Mendix Object guid
 * @param entityName Mendix Entity name
 */
export const getObjectContextFromId = (guid, entityName) => {
    const context = new mendix.lib.MxContext();
    if (guid && entityName) {
        context.setContext(entityName, guid);
    }
    return context;
};

/**
 * Return whether or not a Mendix object is persistable or not
 *
 * @name objectIsPersistable
 * @category Objects
 * @param obj Mendix object
 */
export const objectIsPersistable = (obj) => {
    const entity = obj.getEntity();
    return entityIsPersistable(entity);
};

/**
 * Fetch Mendix objects over an XPath
 *
 * @name fetchByXPath
 * @category Objects
 * @param contextObject Mendix Object
 * @param entityName Entity name for the xpath (//EntityName[Constraint])
 * @param constraint Constraint
 */
export const fetchByXpath = (
    contextObject,
    entityName,
    constraint,
    filter
) => {
    return new Promise((resolve, reject) => {
        const requiresContext = constraint && constraint.indexOf("[%CurrentObject%]") > -1;
        const contextGuid = contextObject.getGuid();

        if (!contextGuid && requiresContext) {
            return resolve(null);
        }

        const entityConstraint = constraint ? constraint.replace(/\[%CurrentObject%]/g, contextGuid) : "";

        const getOptions = {
            callback: (res) => resolve(res),
            error: (error) => reject(error),
            xpath: `//${entityName}${entityConstraint}`,
        };

        if (filter) {
            getOptions.filter = filter;
        }

        window.mx.data.get(getOptions);
    });
};