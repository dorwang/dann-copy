const isBrowser = typeof process !== 'object'; //true if running in browser
let csv;
let fs;
let w;
if(!isBrowser) {
    // nodejs
    fs = require('fs');
    require('mathjs');
    csv = require('fast-csv');
    w = require('@fast-csv/format');

    function random(x1,x2) {
        return Math.random(x2-x1)+x1;
    }
    function exp(x1) {
        return Math.exp(x1);
    }
    function abs(x1) {
        return Math.abs(x1);
    }
    function log(x1) {
        return Math.log(x1);
    }
    function pow(x1,e) {
        return Math.pow(x1,e);
    }
    function sin(x1) {
        return Math.sin(x1);
    }
    function cos(x1) {
        return Math.cos(x1);
    }
    function tan(x1) {
        return Math.tan(x1);
    }
    function round(x1) {
        return Math.round(x1);
    }
    function sqrt(x1) {
        return Math.sqrt(x1);
    }
}
//Activations:
function sigmoid(x) {
    return 1/(1+exp(-x));
}
function sigmoid_d(x) {
    let x1 = sigmoid(x);
    return x1 * (1 - x1);
}
function leakySigmoid(x) {
    return 1/(1+exp(-x))+(x/100);
}
function leakySigmoid_d(x) {
    let x1 = leakySigmoid(x);
    return x1 * (1 - x1);
}
function siLU(x) {

    return x/(1+exp(-x));
}
function siLU_d(x) {
    let top = (1 + exp(-x))+(x*exp(-x));
    let down = pow(1 + exp(-x), 2);
    return top/down;
}
function tanH(x) {

    let top = exp(x) - exp(-x);
    let down = exp(x)+ exp(-x);

    return (top/down);
}
function tanH_d(x) {

    return 1 - pow(tanH(x),2);
}
function leakyReLU(x) {
    if (x >= 0) {
        return 1*x;
    } else {
        return 0.1*x;
    }

}
function leakyReLU_d(x) {
    if (x >= 0) {
        return 1;
    } else {
        return 0.1;
    }

}
function linear(x) {
  return x;
}
function linear_d(x) {
  return 1;
}
function reLU(x) {
    if (x >= 0) {
        return 1*x;
    } else {
        return 0;
    }

}
function reLU_d(x) {
    if (x >= 0) {
        return 1;
    } else {
        return 0;
    }

}
function cosh(x) {
    return ((exp(x)+exp(-x))/2);
}
function sech(x) {
    return 1/cosh(x);
}
//Object Classes
class Layer {
    constructor(type,size,act) {
        this.type = type;
        if (this.type == 'hidden' || this.type == 'output') {
            this.size = size;
            let der = act + '_d';
            this.actname = act;
            this.actname_d = der;
            let func;
            let func_d;
            if (isBrowser) {
                func = window[act];
                func_d = window[der];
            } else {
                func = activations[act];
                func_d = activations[der];
            }
            this.actfunc = func;
            this.actfunc_d = func_d;
            this.layer = new Matrix(this.size,1);
        } else if (this.type == 'input') {
            this.size = size;
            this.layer = new Matrix(this.size,1);
        } else {
            console.log('You need to specify the type of the Layer');
        }
    }
    setAct(act) {
        let der = act + '_d';
        if (activations[der] === undefined) {
            console.error("Dann Error: You need to create the derivative of your custom function. The activation function is set to 'sigmoid' because '"+act+"' does not have a derivative assigned.");
            act = 'sigmoid';
            der = act + '_d';
        }
        this.actname = act;
        this.actname_d = der;
        let func;
        let func_d;

        func = activations[act];
        func_d = activations[der];

        this.actfunc = func;
        this.actfunc_d = func_d;
    }
    log() {
        console.log(this);
    }
}
class Dann {
    constructor(i,o) {

        this.i = i;
        this.inputs = new Layer('input',i);

        this.o = o;
        this.outputs = new Layer('output',o,'sigmoid');

        this.Layers = [this.inputs,this.outputs];
        this.weights = [];
        this.biases = [];
        this.errors = [];
        this.gradients = [];

        this.outs = [];
        this.loss = 0;
        this.losses = [];
        this.lr = 0.001;
        this.arch = [];

        this.epoch = 0;
        this.recordLoss = false;

        this.lossfunc = mse;
        this.lossfunc_s = this.lossfunc.name;

    }
    static mapArray(arr,x1,y1,x2,y2) {
      let newArr = [];
      for (let i = 0; i < arr.length;i++) {
        newArr[i] = map(arr[i],x1,y1,x2,y2);
      }
      return newArr;
    }
    feedForward(inputs, options) {
        let showLog = false;
        let mode = 'cpu';
        if (options !== undefined) {
            if (options.log !== undefined) {
                showLog = options.log;
            } else {
                showLog = false;
            }
            if (options.mode !== undefined) {
                mode = options.mode;
                if (mode == 'gpu') {
                    console.log('gpu version coming soon');
                }
            } else {
                mode = 'cpu';
            }
        }

        if (inputs.length == this.i) {
            this.Layers[0].layer = Matrix.fromArray(inputs);
        } else {
            for (let i = 0; i < this.o; i++) {
                this.outs[i] = 0;
            }
            console.error('Dann Error: The input array length does not match the number of inputs the dannjs model has.');
            return this.outs;
        }
        if (this.weights.length === 0) {
            //console.error('Dann Error: The weights were not initiated. Please use the Dann.makeWeights(); function after the initialization of the layers.');
            this.makeWeights();
        }

        for(let i = 0; i < this.weights.length;i++) {
            let pLayer = this.Layers[i];

            let layerObj = this.Layers[i+1];

            layerObj.layer = Matrix.multiply(this.weights[i],pLayer.layer);
            layerObj.layer.add(this.biases[i]);
            layerObj.layer.map(layerObj.actfunc);

        }
        this.outs = Matrix.toArray(this.Layers[this.Layers.length-1].layer);
        if (showLog == true) {

            console.log('Prediction: ',this.outs);

        }
        return this.outs;

    }
    backpropagate(inputs, t, options) {

        let showLog = false;
        let mode = 'cpu';
        let recordLoss = false;

        if (options !== undefined) {
            if (options.log !== undefined) {
                showLog = options.log;
            } else {
                showLog = false;
            }
            if (options.mode !== undefined) {
                mode = options.mode;
                if (mode == 'gpu') {
                    console.log('gpu version coming soon');
                }
            } else {
                mode = 'cpu';
            }
            if (options.saveLoss !== undefined) {
                recordLoss = options.saveLoss;
            } else {
                recordLoss = true;
            }
        }

        let targets = new Matrix(0,0);
        if (t.length == this.o) {
            targets = Matrix.fromArray(t);
        } else {
            console.error('Dann Error: The target array length does not match the number of inputs the dannjs model has.');
            return null;
        }
        if (typeof this.lr !== 'number') {
            console.error('Dann Error: The learning rate specified (Dann.lr property) is not a number.');
            return null;
        }
        this.outs = this.feedForward(inputs, {log:false,mode:mode});

        this.errors[this.errors.length-1] = Matrix.subtract(targets, this.Layers[this.Layers.length-1].layer);

        this.gradients[this.gradients.length-1] = Matrix.map(this.Layers[this.Layers.length-1].layer,this.Layers[this.Layers.length-1].actfunc_d);
        this.gradients[this.gradients.length-1].mult(this.errors[this.errors.length-1]);
        this.gradients[this.gradients.length-1].mult(this.lr);

        for (let i = this.weights.length-1; i > 0;i--) {
            let h_t = Matrix.transpose(this.Layers[i].layer);

            let weights_deltas = Matrix.multiply(this.gradients[i],h_t);

            this.weights[i].add(weights_deltas);
            this.biases[i].add(this.gradients[i]);

            let weights_t = Matrix.transpose(this.weights[i]);
            this.errors[i-1] = Matrix.multiply(weights_t,this.errors[i]);
            this.gradients[i-1] = Matrix.map(this.Layers[i].layer, this.Layers[i].actfunc_d);
            this.gradients[i-1].mult(this.errors[i-1]);
            this.gradients[i-1].mult(this.lr);
        }

        let i_t = Matrix.transpose(this.Layers[0].layer);
        let weights_deltas = Matrix.multiply(this.gradients[0], i_t);

        this.weights[0].add(weights_deltas);
        this.biases[0].add(this.gradients[0]);

        this.loss = this.lossfunc(this.outs,t);
        if (recordLoss == true) {
            this.losses.push(this.loss);
        }

        if (showLog == true) {

            console.log('Prediction: ',this.outs);
            console.log('target: ',t);
            console.log('Loss: ',this.loss);

        }

    }
    setLossFunction(str) {

        if (lossfuncs[str] == undefined) {
            if (typeof str === 'string') {
                console.error("Dann Error: '"+str+"' is not a valid loss function, as a result, the model's loss function is set to 'mse' by default.");

            } else {
                console.error("Dann Error: Did not detect string value, as a result, the loss function is set to 'mse' by default.");

            }

            str = 'mse';
        }
        this.lossfunc_s = str
        this.lossfunc = lossfuncs[this.lossfunc_s];

    }
    outputActivation(act) {

        if (activations[act] == undefined) {
            if (typeof act === 'string') {
                console.error("Dann Error: '" +act+ "' is not a valid activation function, as a result, the activation function is set to 'sigmoid' by default.");
            } else {
                console.error("Dann Error: Did not detect a string value, as a result, the activation function is set to 'sigmoid' by default.");
            }

            act = 'sigmoid';
        } else {
            this.Layers[this.Layers.length-1].setAct(act);
        }


    } //Layer ready
    makeWeights() {


        for (let i = 0; i < this.Layers.length-1;i++) {
            let previousLayerObj = this.Layers[i];
            let layerObj = this.Layers[i+1];

            let weights = new Matrix(layerObj.layer.rows,previousLayerObj.layer.rows);
            let biases = new Matrix(layerObj.layer.rows,1);

            weights.randomize();
            biases.randomize();
            this.weights[i] = weights;
            this.biases[i] = biases;

            this.errors[i] = new Matrix(layerObj.layer.rows,1);
            this.gradients[i] = new Matrix(layerObj.layer.rows,1);
            if (layerObj.actfunc == undefined) {
                let n = "sigmoid";
                let d = n + "_d";
                layerObj.actname = n;
                layerObj.actname_d = d;
                if (isBrowser) {
                    layerObj.actfunc = window[n];
                    layerObj.actfunc_d = window[d];
                } else {
                    layerObj.actfunc = activations[n];
                    layerObj.actfunc_d = activations[d];
                }

            }


        }
        for (let i = 0; i<this.Layers.length;i++) {
            let layerObj = this.Layers[i];
            this.arch[i] = layerObj.layer.rows;
        }

    } //Layer Ready
    addHiddenLayer(size, act) {

        if (activations[act] == undefined) {
            if (typeof act === 'string') {
                console.error("Dann Error: '" +act+ "' is not a valid activation function, as a result, the activation function is set to 'sigmoid' by default.");
            } else {
                console.error("Dann Error: Did not detect a string value, as a result, the activation function is set to 'sigmoid' by default.");
            }

            act = 'sigmoid';
        }
        let layer = new Layer('hidden',size,act);
        this.Layers.splice(this.Layers.length-1,0,layer);

    } //Layer Ready
    log() {
        if (this.weights.length === 0) {
            //console.error('Dann Error: The weights were not initiated. Please use the Dann.makeWeights(); function after the initialization of the layers.');
            this.makeWeights();
        }
        console.log("Dann NeuralNetwork:")
        console.log(" ");
        console.log("  Layers:")
        for (let i = 0; i < this.Layers.length;i++) {
            let layerObj = this.Layers[i];
            let str = "Hidden Layer: ";
            let afunc = "";
            if (i == 0) {
                str = "Input Layer:   ";
                afunc = "       ";
            } else if (i == layerObj.length-1) {
                str = "Output Layer:  ";
                afunc = "  ("+layerObj.actname+")";
            } else {
                afunc = "  ("+layerObj.actname+")";
            }
            console.log("    " + str + Matrix.toArray(layerObj.layer).length + afunc);
        }
        console.log(" ");
        console.log("  Other Values: ");
        console.log("    Learning rate: " + this.lr);
        console.log("    Loss Function: " + this.lossfunc.name);

    } //Layer Ready
    save(name) {
        let path;
        let overwritten = false;
        if (!isBrowser) {
            path = './savedDanns/'+name+'/dannData.json';
            if (fs.existsSync(path)) {
                overwritten = true;
            }
        }
        //weights
        let wdata = [];
        for (let i = 0; i < this.weights.length;i++) {
            wdata[i] =  JSON.stringify(this.weights[i].matrix);
        }
        let w_str = JSON.stringify(wdata);
        //layers
        let ldata = [];
        for (let i = 0; i < this.Layers.length;i++) {
            ldata[i] =  JSON.stringify(this.Layers[i]);
        }
        let l_str = JSON.stringify(ldata);
        //biases
        let bdata = [];
        for (let i = 0; i < this.biases.length;i++) {
            bdata[i] =  JSON.stringify(this.biases[i].matrix);
        }
        let b_str = JSON.stringify(bdata);
        //errors
        let edata = [];
        for (let i = 0; i < this.errors.length;i++) {
            edata[i] =  JSON.stringify(this.errors[i].matrix);
        }
        let e_str = JSON.stringify(edata);
        //gradients
        let gdata = [];
        for (let i = 0; i < this.gradients.length;i++) {
            gdata[i] =  JSON.stringify(this.gradients[i].matrix);
        }
        let g_str = JSON.stringify(gdata);
        let dataOBJ = {wstr: w_str,lstr:l_str,bstr:b_str,estr:e_str,gstr:g_str,arch:this.arch,lrate:this.lr,lf:this.lossfunc_s};

        if (isBrowser) {

            downloadSTR(dataOBJ,name);
        } else {
            if (!fs.existsSync('./savedDanns')){
                fs.mkdirSync('./savedDanns');
            }
            if (!fs.existsSync('./savedDanns/'+name)){
                fs.mkdirSync('./savedDanns/'+name);
            }

            let csvFile = [];
            csvFile.push(['Dann','']);
            csvFile.push(['Arch: ', this.arch]);
            csvFile.push(['Lr: ', this.lr]);
            csvFile.push(['','']);
            csvFile.push(['Index','AvgLoss']);
            for (let i = 0; i < this.losses.length; i++) {
                csvFile.push([i+1,this.losses[i]]);
            }

            w.writeToPath('./savedDanns/'+name+'/losses.csv', csvFile)
            .on('error', err => console.error(err))
            .on('finish', () => console.log('saved loss report at '+'./savedDanns/'+name+'/losses.csv'));



            fs.writeFileSync(path, JSON.stringify(dataOBJ));
            if (overwritten == true) {
                console.log('\x1b[32m',"");
                this.log();
                console.log("Succesfully overwritten the Dann Model at ./savedDanns/"+name+"/dannData.json ");
                console.log("\x1b[0m","");
            } else {
                console.log('\x1b[32m',"");
                this.log();
                console.log("Succesfully saved the Dann Model at ./savedDanns/"+name+"/dannData.json ");
                console.log("\x1b[0m","");
            }
        }

    } //Layer Ready
    mutateRandom(randomFactor,probability) {

        if (typeof randomFactor !== 'number') {
            console.error('Dann Error: Dann.mutateRandom(); range argument must be a number.');
            return null;
        } else if (typeof probability !== 'number') {
            console.error('Dann Error: Dann.mutateRandom(); probability argument must be a number.');
            return null;
        }
        for (let i = 0; i < this.Layers.length;i++) {
            this.Layers[i].layer.addRandom(randomFactor,probability);
        }
    }
    mutateAdd(randomFactor) {
        if (typeof randomFactor !== 'number') {
            console.error('Dann Error: Dann.mutateAdd(); percent argument must be a number.');
            return null;
        }
        for (let i = 0; i < this.Layers.length;i++) {
            this.Layers[i].layer.addPrecent(randomFactor);
        }
    }
    // loadFromJSON(objstr) {
    //
    //     let xdata =  JSON.parse(objstr);
    //
    //     let newNN = xdata;
    //
    //     //  {wstr: w_str,lstr:l_str,bstr:b_str,estr:e_str,gstr:g_str,afunc:this.aFunc_s,arch:this.arch,lrate:this.lr}
    //     nn.i = newNN.arch[0];
    //     nn.inputs = new Matrix(this.i, 1);
    //     nn.o = newNN.arch[newNN.arch.length-1];
    //     nn.outputs = new Matrix(this.o,1);
    //
    //     let slayers = JSON.parse(newNN.lstr);
    //     for (let i = 0; i < slayers.length; i++) {
    //         nn.Layers[i] = JSON.parse(slayers[i]);
    //     }
    //     let sweights = JSON.parse(newNN.wstr);
    //     if (!(this.weights.length > 0)) {
    //         this.makeWeights();
    //     }
    //     for (let i = 0; i < sweights.length; i++) {
    //         nn.weights[i].set(JSON.parse(sweights[i]));
    //     }
    //     let sbiases = JSON.parse(newNN.bstr);
    //     for (let i = 0; i < sbiases.length; i++) {
    //         nn.biases[i].set(JSON.parse(sbiases[i]));
    //     }
    //     let serrors = JSON.parse(newNN.estr);
    //     for (let i = 0; i < serrors.length; i++) {
    //         nn.errors[i].set(JSON.parse(serrors[i]));
    //     }
    //     let sgradients = JSON.parse(newNN.gstr);
    //     for (let i = 0; i < sgradients.length; i++) {
    //         nn.gradients[i].set(JSON.parse(sgradients[i]));
    //     }
    //
    //     nn.lossfunc = window[newNN.lf];
    //     nn.lossfunc_s = newNN.lf;
    //
    //     nn.outs = Matrix.toArray(nn.Layers[nn.Layers.length-1]);
    //     nn.loss = 0;
    //     nn.losses = [];
    //     nn.lr = newNN.lrate;
    //     nn.arch = newNN.arch;
    //
    //     nn.log();
    //     console.log("");
    //     console.log("Succesfully loaded the Dann Model");
    // } //Layer Ready
    load(name) {
        if (!isBrowser) {
            let path = './savedDanns/'+name+'/dannData.json';
            if (fs.existsSync(path)) {
                let text = fs.readFileSync(path, 'utf8');
                let xdata =  JSON.parse(text);

                let newNN = xdata;
                //console.log(newNN)

                //  {wstr: w_str,lstr:l_str,bstr:b_str,estr:e_str,gstr:g_str,afunc:this.aFunc_s,arch:this.arch,lrate:this.lr}
                this.i = newNN.arch[0];
                this.inputs = new Matrix(this.i,1);
                this.o = newNN.arch[newNN.arch.length-1];
                this.outputs = new Matrix(this.o,1);

                let slayers = JSON.parse(newNN.lstr);
                for (let i = 0; i < slayers.length; i++) {
                  this.Layers[i] = JSON.parse(slayers[i]);
                }
                let sweights = JSON.parse(newNN.wstr);

                if (!(this.weights.length > 0)) {
                    this.makeWeights();
                }
                for (let i = 0; i < sweights.length; i++) {
                  this.weights[i].set(JSON.parse(sweights[i]));
                }


                let sbiases = JSON.parse(newNN.bstr);
                for (let i = 0; i < sbiases.length; i++) {
                  this.biases[i].set(JSON.parse(sbiases[i]));
                }
                let serrors = JSON.parse(newNN.estr);
                for (let i = 0; i < serrors.length; i++) {
                  this.errors[i].set(JSON.parse(serrors[i]));
                }
                let sgradients = JSON.parse(newNN.gstr);
                for (let i = 0; i < sgradients.length; i++) {
                  this.gradients[i].set(JSON.parse(sgradients[i]));
                }

                this.epoch = newNN.age;
                this.recordLoss = newNN.recLoss;

                this.lossfunc = lossfuncs[newNN.lf];
                this.lossfunc_s = newNN.lf;

                this.outs = Matrix.toArray(this.Layers[this.Layers.length-1]);
                this.loss = 0;
                this.losses = [];
                this.lr = newNN.lrate;
                this.arch = newNN.arch;


                console.log('\x1b[32m',"");
                        this.log();
                console.log("Succesfully loaded the Dann Model");
                console.log("\x1b[0m","");

            } else {
                console.error('ERROR: file not found');
            }
        } else {
            upload(this);
        }

    } //Layer Ready
}
class Matrix {
    constructor(rows,cols) {

        this.rows = rows;
        this.cols = cols;
        this.matrix = [];

        for (let i = 0; i < this.rows; i++) {
            this.matrix[i] = [];
            for (let j = 0; j < this.cols; j++) {
                this.matrix[i][j] = 0;
            }

        }
    }
    static toArray(m) {
        let ans = [];
        if (m.cols == 1) {

            for (let i = 0; i < m.rows; i++) {
                ans[i] = m.matrix[i][0];
            }
        }
        return ans;
    }
    static fromArray(arr) {
        let m = new Matrix(arr.length,1);

        for (let i = 0; i < arr.length; i++) {
            m.matrix[i][0] = arr[i];
        }

        return m;
    }
    static transpose(m) {
        let result = new Matrix(m.cols,m.rows);
        for (let i = 0; i < m.rows; i++) {
            for(let j = 0; j < m.cols; j++) {
                result.matrix[j][i] = m.matrix[i][j];
            }
        }
        return result;
    }
    static map(m,f) {
        for (let i = 0; i < m.rows; i++) {
            for(let j = 0; j < m.cols; j++) {
                let v = m.matrix[i][j];
                m.matrix[i][j] = f(v);
            }
        }
        return m;
    }
    static addition(m1,m2) {

        let a = m1;
        let b = m2;

        let ans = new Matrix(a.rows, a.cols);
        if (a.rows !== b.rows || a.cols !== b.cols) {
            return;
        } else {
            for (let i = 0; i < ans.rows; i++) {
                for(let j = 0; j < ans.cols; j++) {
                    ans.matrix[i][j] = a.matrix[i][j] - b.matrix[i][j];
                }
            }
        }
        return ans;
    }
    static subtract(m1,m2) {

        let a = m1;
        let b = m2;

        let ans = new Matrix(a.rows, a.cols);
        if (a instanceof Matrix && b instanceof Matrix) {

                for (let i = 0; i < ans.rows; i++) {

                    for(let j = 0; j < ans.cols; j++) {

                        ans.matrix[i][j] = a.matrix[i][j] - b.matrix[i][j];
                    }
                }
        }
        return ans;
    }
    static multiply(m1,m2) {

        let a = m1;
        let b = m2;

        let ans = new Matrix(a.rows, b.cols);
        if (m1 instanceof Matrix && m2 instanceof Matrix) {
            if (a.cols !== b.rows) {
                console.log("not compatible");
                return undefined;
            } else {
                for (let i = 0; i < ans.rows; i++) {
                    for (let j = 0; j < ans.cols; j++) {
                        let sum = 0;
                        for (let k = 0; k < a.cols; k++) {
                          sum += a.matrix[i][k] * b.matrix[k][j];
                        }
                        ans.matrix[i][j] = sum;
                    }
                }
            }
            return ans;
        }
    }
    addRandom(magnitude,prob) {
        for (let i = 0; i < this.rows; i++) {
            for(let j = 0; j < this.cols; j++) {
                let w = this.matrix[i][j];
                let ran = random(0,1);
                if (ran < prob) {
                    this.matrix[i][j] += w*random(-magnitude,magnitude);
                }

            }
        }
    }
    addPrecent(magnitude) {
        for (let i = 0; i < this.rows; i++) {
            for(let j = 0; j < this.cols; j++) {
                let w = this.matrix[i][j];
                this.matrix[i][j] += w*magnitude;

            }
        }
    }
    set(matrix) {
        this.matrix = matrix;
        this.rows = matrix.length;
        this.cols = matrix[0].length;
    }
    add(n) {
        if (n instanceof Matrix) {
            if (this.rows !== n.rows || this.cols !== n.cols) {
                return;
            } else {
                for (let i = 0; i < this.rows; i++) {
                    for(let j = 0; j < this.cols; j++) {
                        this.matrix[i][j] += n.matrix[i][j];
                    }
                }
            }

        } else {
            for (let i = 0; i < this.rows; i++) {
                for(let j = 0; j < this.cols; j++) {
                    this.matrix[i][j] += n;
                }
            }
        }
    }
    sub(n) {

        for (let i = 0; i < this.rows; i++) {
            for(let j = 0; j < this.cols; j++) {
                this.matrix[i][j] -= n;
            }
        }
    }
    mult(n) {

        if (n instanceof Matrix) {
            if (this.rows !== n.rows || this.cols !== n.cols) {
                console.log("rows of A must match rows of B")
                return;
            } else {
                for (let i = 0; i < this.rows; i++) {
                    for(let j = 0; j < this.cols; j++) {
                        this.matrix[i][j] *= n.matrix[i][j];
                    }
                }
            }

        } else {
            for (let i = 0; i < this.rows; i++) {
                for(let j = 0; j < this.cols; j++) {
                    this.matrix[i][j] *= n;
                }
            }
        }

    }

    initiate() {
        for (let i = 0; i < this.matrix.length; i++) {
            for (let j = 0; j < this.matrix[i].length; j++) {
                this.matrix[i][j] = 1;
            }
        }
    }
    map(f) {
        for (let i = 0; i < this.rows; i++) {
            for(let j = 0; j < this.cols; j++) {
                let v = this.matrix[i][j];
                this.matrix[i][j] = f(v);
            }
        }
    }
    randomize() {
        for (let i = 0; i < this.matrix.length; i++) {
            for (let j = 0; j < this.matrix[i].length; j++) {
                this.matrix[i][j] = random(-1,1);
            }
        }
    }
}
// loss functions:
function mae(predictions,target) {
    let sum = 0;
    let ans = 0;
    let n = target.length;
    for (let i = 0; i < n; i++) {
        let y = target[i]
        let yHat = predictions[i];
        sum += abs(y - yHat);
    }
    ans = sum/n;
    return ans;
}
function bce(predictions,target) {
    let sum = 0;
    let ans = 0;
    let n = target.length;
    for (let i = 0; i < n; i++) {
      let y = target[i]
      let yHat = predictions[i];

      sum+= y*log(yHat)+(1-y)*log(1-yHat);

    }
    ans = -sum/n;
    return ans;
}
function lcl(predictions,target) {
    let sum = 0;
    let ans = 0;
    let l = target.length;
    for (let i = 0; i < l; i++) {
      let y = target[i]
      let yHat = predictions[i];

        sum += log(cosh(yHat - y));
    }
    ans = sum/l;
    return ans;
}
function mbe(predictions,target) {
    let sum = 0;
    let ans = 0;
    let l = target.length;
    for (let i = 0; i < l; i++) {
      let y = target[i]
      let yHat = predictions[i];

        sum += (y - yHat);
    }
    ans = sum/this.o;
    return ans;
}
function rmse(predictions,target) {
    let sum = 0;
    let ans = 0;
    let n = target.length;
    for (let i = 0; i < n; i++) {
      let y = target[i]
      let yHat = predictions[i];

        sum += pow(y - yHat,2);
    }
    ans = sqrt(sum/n);
    return ans;
}
function mce(predictions,target) {
    let sum = 0;
    let ans = 0;
    let n = target.length;
    for (let i = 0; i < n; i++) {
      let y = target[i]
      let yHat = predictions[i];

        sum += pow(abs(y - yHat),3);
    }
    ans = sum/n;
    return ans;
}
function mse(predictions,target) {
    let sum = 0;
    let ans = 0;
    let n = target.length;
    for (let i = 0; i < n; i++) {
      let y = target[i]
      let yHat = predictions[i];

        sum += pow(y - yHat,2);
    }
    ans = sum/n;
    return ans;
}
// Download Functions:
function downloadSTR(obj, exportName) {
  let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj));
  let downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href",     dataStr);
  downloadAnchorNode.setAttribute("download", exportName + ".json");
  document.body.appendChild(downloadAnchorNode); // required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();

}
function clickedUpload(nn) {
    let element = document.getElementById('upload');
    let file = element.files[0];

    let reader = new FileReader();

    reader.readAsText(file);

    reader.onload = function() {


        let xdata =  JSON.parse(reader.result);

        let newNN = xdata;

        nn.i = newNN.arch[0];
        nn.inputs = new Matrix(this.i, 1);
        nn.o = newNN.arch[newNN.arch.length-1];
        nn.outputs = new Matrix(this.o,1);

        let slayers = JSON.parse(newNN.lstr);
        for (let i = 0; i < slayers.length; i++) {
            let layerObj = JSON.parse(slayers[i]);

            let act = layerObj.actname;
            let der = act + '_d';
            layerObj.actname = act;
            layerObj.actname_d = der;
            let func;
            let func_d;
            if (isBrowser) {
                func = window[act];
                func_d = window[der];
            } else {
                func = activations[act];
                func_d = activations[der];
            }
            layerObj.actfunc = func;
            layerObj.actfunc_d = func_d;
            nn.Layers[i] = layerObj;
        }
        let sweights = JSON.parse(newNN.wstr);
        for (let i = 0; i < sweights.length; i++) {
            nn.weights[i].set(JSON.parse(sweights[i]));
        }
        let sbiases = JSON.parse(newNN.bstr);
        for (let i = 0; i < sbiases.length; i++) {
            nn.biases[i].set(JSON.parse(sbiases[i]));
        }
        let serrors = JSON.parse(newNN.estr);
        for (let i = 0; i < serrors.length; i++) {
            nn.errors[i].set(JSON.parse(serrors[i]));
        }
        let sgradients = JSON.parse(newNN.gstr);
        for (let i = 0; i < sgradients.length; i++) {
            nn.gradients[i].set(JSON.parse(sgradients[i]));
        }

        nn.lossfunc = window[newNN.lf];
        nn.lossfunc_s = newNN.lf;

        nn.outs = Matrix.toArray(nn.Layers[nn.Layers.length-1]);
        nn.loss = 0;
        nn.losses = [];
        nn.lr = newNN.lrate;
        nn.arch = newNN.arch;

        nn.log();
        console.log("");
        console.log("Succesfully loaded the Dann Model");
    };

    reader.onerror = function() {
      console.log(reader.error);
    };

    element.remove();

}
function upload(nn) {
    let downloadAnchorNode = document.createElement('input');
    downloadAnchorNode.setAttribute("type", "file");
    downloadAnchorNode.setAttribute("id", "upload");
    downloadAnchorNode.setAttribute("onChange", "clickedUpload(nn)");
    document.body.appendChild(downloadAnchorNode);

}
//Color Functions & values
function colorGradientFunc(x) {
  return 1 / (1+ exp(-2*x))
}
function colorGradientFunc2(x) {
  return 1 / (1+ exp(-10*(x-0.5)))
}
let dragged = false;
let fontColor = [255,255,255];
let contourColor = [0,0,0];
//p5js Graphic tools (not documented yet).
class NetPlot {
  constructor(x,y,w,h,nn) {
    this.pos = createVector(x,y);
    this.w = w;
    this.h = h;
    this.nn = nn;
    this.spacingY = h/(this.nn.i-1);
    this.layerSpacing = w/(this.nn.Layers.length-1);
    this.bufferY = this.spacingY/2;
    this.size = 8;
    this.frame = false;
    this.wColors = [[255, 60, 0],[0,195,255]];

  }

  renderWeights() {
    stroke(contourColor);
    for (let i = 0; i < this.nn.Layers.length; i++) {

      let layer = Matrix.toArray(this.nn.Layers[i]);

      this.spacingY = (this.h/(layer.length));
      this.bufferY = this.spacingY/2

      if (i !== this.nn.Layers.length-1) {

        let nextLayer = Matrix.toArray(this.nn.Layers[i+1]);
        let sY = (this.h/(nextLayer.length));
        let bY = sY/2;

        for (let j = 0; j < nextLayer.length; j++) {

          let x = this.pos.x+((i+1)*this.layerSpacing);
          let y = this.pos.y+bY+((j)*sY);
          let x2 = 0;
          let y2 = 0

          for (let k = 0; k < layer.length; k++) {

            let weights = (this.nn.weights[i]).matrix;
            x2 = this.pos.x+((i)*this.layerSpacing);
            y2 = this.pos.y+this.bufferY+((k)*this.spacingY);
            stroke(this.mapColor(colorGradientFunc(weights[j][k])));
            strokeWeight(map(sqrt(int(weights[j][k]*1000)/1000),0,2,1,2));
            line(x,y,x2,y2);

          }

        }
      }


    }
  }
  renderLayers() {
    fill(255);
    noStroke();

    for (let i = 0; i < this.nn.Layers.length; i++) {

      let layer = Matrix.toArray(this.nn.Layers[i]);
      this.spacingY = (this.h/(layer.length));
      this.bufferY = this.spacingY/2;
      for (let j = 0; j < layer.length; j++) {

        let x = this.pos.x+((i)*this.layerSpacing);
        let y = this.pos.y+this.bufferY+((j)*this.spacingY);

        //let col = map(layer[j],0,1,0,255);
        let col = this.mapColor(colorGradientFunc2(layer[j]))
        fill(col);
        ellipse(x,y,this.size,this.size);

      }
    }
  }

  mapColor(x) {
    let color1 = this.wColors[0]
    let color2 = this.wColors[1]
    let r = map(x,0,1,color2[0],color1[0])
    let g = map(x,0,1,color2[1],color1[1])
    let b = map(x,0,1,color2[2],color1[2])
    return color(r,g,b)
  }
  render() {
    noFill();
    stroke(contourColor[0],contourColor[1],contourColor[2]);
    if (this.frame == true) {
      rect(this.pos.x,this.pos.y,this.w,this.h);
    }


    if (dragged&&mouseX >= this.pos.x && mouseX<=this.pos.x+this.w&&mouseY >= this.pos.y&&mouseY<=this.pos.y+this.h) {
        this.pos.x = mouseX-(this.w/2);
        this.pos.y = mouseY-(this.h/2);
    }
    this.renderWeights();
    this.renderLayers();

  }
}
class Graph {
    constructor(x,y,w,h) {
        this.pos = createVector(x,y);
        this.w = w;
        this.h = h;
        this.s = 1;
        this.min = 1;
        this.max = 0;
        this.lines = [];
        this.names = [];
        this.color = [];
        this.dragged = false;
        this.grid = 4;
        this.step = 0;

    }
    addValue(x,color,name) {
        this.color.push(color)
        this.lines.push(x);
        this.names.push(name);
    }
    render() {
        noFill();


        strokeWeight(1);

        stroke(contourColor[0],contourColor[1],contourColor[2],80);

        for (let i = 0; i < this.grid; i++) {
            let y = (this.h/this.grid)*i;
            line(this.pos.x,y+this.pos.y,this.pos.x+this.w,y+this.pos.y);
        }
        stroke(contourColor[0],contourColor[1],contourColor[2])
        rect(this.pos.x,this.pos.y,this.w,this.h);
        if (dragged&&mouseX >= this.pos.x && mouseX<=this.pos.x+this.w&&mouseY >= this.pos.y&&mouseY<=this.pos.y+this.h) {
          this.pos.x = mouseX-(this.w/2);
          this.pos.y = mouseY-(this.h/2);
        }
        for (let a = 0; a < this.lines.length; a++) {
            stroke(this.color[a]);
            beginShape();
            if (this.lines[a].length/int(this.s) >= this.w*int(this.s)) {
                this.s*=2;
            }

            for (let i = 0; i < int(this.lines[a].length/int(this.s)); i+=int(this.s)) {
                let x = (i/int(this.s))+this.pos.x;
                let y = map(this.lines[a][i*int(this.s)],this.min,this.max,this.pos.y,this.pos.y+this.h);
                vertex(x, y);

            }
            endShape();
            noStroke();
            fill(this.color[a])
            rect((this.pos.x+this.w)-((this.pos.x+this.w)/6),(a*20)+10+this.pos.y,20,10);
            //let textstr = Object.keys({this.lines[a]})[0];

            //console.log(Object.keys(this.lines[a])[0]);
            text(this.names[a],(this.pos.x+this.w)-((this.pos.x+this.w)/6)+23,(a*20)+19+this.pos.y);
            noFill();
        }
        stroke(contourColor[0],contourColor[1],contourColor[2])
        let div = 1;
        if (this.s >= 8) {
            div = 10;
        }
        let length = int(this.w/(this.step/(pow(this.s,2)))/div);
        for (let i = 0; i < length; i++) {
            if (this.s >= 8) {
            }
            let x = ((this.step/(pow(this.s,2)))*(i*div))+this.pos.x;
            let y = this.pos.y+this.h;
            line(x,y,x,y-5);
            //text(x,y+8,div);

        }
        noStroke();
    }

}
class GradientGraph {
    constructor(x,y,w,h,nn) {
        this.pos = createVector(x,y);
        this.w = w;
        this.h = h;

        this.nn = nn;
        this.pixelSize = 5;
        this.positionsX = [];
        this.offsets = [];
        this.boxespos = [];
    }
    initiateValues() {
        for (let m = 0; m < nn.weights.length;m++) {
            let weights = nn.weights[m].matrix;
            let offset = 0;
            if(m == 0) {
                offset = 0;
                this.positionsX[m] = offset;
                this.offsets.push(offset);
            } else {
                let sum = 0;
                for (let i = 0; i < m; i++) {
                    sum+=this.positionsX[i];
                }
                offset = this.pixelSize*(sqrt(nn.weights[m-1].matrix[0].length))*sqrt(nn.weights[m-1].matrix.length);
                this.positionsX[m] = offset;
                offset += sum;
                this.offsets.push(offset);
            }

        }
    }
    render() {

        for (let m = 0; m < nn.weights.length;m++) {
            let weights = nn.weights[m].matrix;

            let len = sqrt(weights.length);

            for (let i = 0; i < len;i++) {
                for (let j = 0; j< len;j++) {

                    let windex = 0;
                    if (m !== 0) {
                        windex = m-1;
                    } else {
                        windex = 0;
                    }

                    let innerLen = sqrt(weights[windex].length);

                    let bx = this.pos.x+((this.pixelSize*innerLen)*i)+this.offsets[m]+(m*10);
                    let by = this.pos.y+((this.pixelSize*innerLen)*j);


                    for (let x = 0; x < innerLen;x++) {
                        for (let y = 0; y< innerLen;y++) {
                            let bx_ = (x*this.pixelSize)+bx;
                            let by_ = (y*this.pixelSize)+by;
                            fill(map(weights[(i*len)+j][(x*innerLen)+y],-1,1,0,255));
                            noStroke()
                            rect(bx_,by_,this.pixelSize,this.pixelSize)
                        }
                    }
                    noFill();
                    stroke(255,0,0,255);
                    strokeWeight(1);
                    rect(bx,by,(this.pixelSize*innerLen),(this.pixelSize*innerLen))

                }
            }
        }




    }
}
//Node Module Exports:
let activations = {
    leakySigmoid: leakySigmoid,
    leakySigmoid_d: leakySigmoid_d,
    sigmoid: sigmoid,
    sigmoid_d: sigmoid_d,
    tanH: tanH,
    tanH_d: tanH_d,
    siLU: siLU,
    siLU_d: siLU_d,
    reLU: reLU,
    reLU_d: reLU_d,
    leakyReLU: leakyReLU,
    leakyReLU_d: leakyReLU_d
}
let lossfuncs = {
    mae: mae,
    bce: bce,
    lcl: lcl,
    mbe: mbe,
    mce: mce,
    mse: mse,
    rmse: rmse
}
if (typeof process === 'object') {
    module.exports = {
        dann: Dann,
        layer: Layer,
        matrix: Matrix,
        activations: activations,
        lossfuncs: lossfuncs
    }
}
