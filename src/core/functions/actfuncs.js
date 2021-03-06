//Activation functions:
function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}
function sigmoid_d(x) {
  let x1 = sigmoid(x);
  return x1 * (1 - x1);
}
function leakySigmoid(x) {
  return 1 / (1 + Math.exp(-x)) + x / 100;
}
function leakySigmoid_d(x) {
  let x1 = leakySigmoid(x);
  return x1 * (1 - x1);
}
function siLU(x) {
  return x / (1 + Math.exp(-x));
}
function siLU_d(x) {
  let top = 1 + Math.exp(-x) + x * Math.exp(-x);
  let down = Math.pow(1 + Math.exp(-x), 2);
  return top / down;
}
function tanH(x) {
  let top = Math.exp(x) - Math.exp(-x);
  let down = Math.exp(x) + Math.exp(-x);
  return top / down;
}
function tanH_d(x) {
  return 1 - Math.pow(tanH(x), 2);
}
function leakyReLUCapped(x) {
  if (x >= 0 && x <= 6) {
    return x;
  } else if (x < 0) {
    return 0.1 * x;
  } else {
    return 6;
  }
}
function leakyReLUCapped_d(x) {
  if (x >= 0 && x <= 6) {
    return 1;
  } else if (x < 0) {
    return 0.1;
  } else {
    return 0;
  }
}
function leakyReLU(x) {
  if (x >= 0) {
    return 1 * x;
  } else {
    return 0.01 * x;
  }
}
function leakyReLU_d(x) {
  if (x >= 0) {
    return 1;
  } else {
    return 0.01;
  }
}
function reLU(x) {
  if (x >= 0) {
    return 1 * x;
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
function sinc(x) {
  if (x === 0) {
    return 1;
  } else {
    return Math.sin(x) / x;
  }
}
function sinc_d(x) {
  if (x === 0) {
    return 0;
  } else {
    return Math.cos(x) / x - Math.sin(x) / (x * x);
  }
}
function softsign(x) {
  return x / (1 + Math.abs(x));
}
function softsign_d(x) {
  let down = 1 + Math.abs(x);
  return 1 / (down * down);
}
function binary(x) {
  if (x <= 0) {
    return 0;
  } else {
    return 1;
  }
}
function binary_d(x) {
  return 0;
}
function softplus(x) {
  return Math.log(1 + Math.exp(x));
}
function softplus_d(x) {
  return sigmoid(x);
}

// Exporting Functions:
let activations = {
  //Basic:
  sigmoid: sigmoid,
  sigmoid_d: sigmoid_d,
  tanH: tanH,
  tanH_d: tanH_d,
  siLU: siLU,
  siLU_d: siLU_d,
  reLU: reLU,
  reLU_d: reLU_d,
  leakyReLU: leakyReLU,
  leakyReLU_d: leakyReLU_d,
  sinc: sinc,
  sinc_d: sinc_d,
  softsign: softsign,
  softsign_d: softsign_d,
  binary: binary,
  binary_d: binary_d,
  softplus: softplus,
  softplus_d: softplus_d,
  //Experimental:
  leakySigmoid: leakySigmoid,
  leakySigmoid_d: leakySigmoid_d,
  leakyReLUCapped: leakyReLUCapped,
  leakyReLUCapped_d: leakyReLUCapped_d,
};
