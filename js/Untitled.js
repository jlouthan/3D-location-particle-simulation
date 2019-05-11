var Foo = function () {
    "use strict";
    if (Foo._instance) {
        //this allows the constructor to be called multiple times
        //and refer to the same instance. Another option is to
        //throw an error.
        return Foo._instance;
    }
    Foo._instance = this;
    //Foo initialization code
};

Foo.getInstance = function () {
    "use strict";
    return Foo._instance || new Foo();
}
