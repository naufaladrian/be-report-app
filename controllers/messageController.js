const getMessage = (req, res) => {
    res.send("Hello From Express 🚀");
};

const postMessage = (req, res) => {
    const { name } = req.body;
    res.json({ message: `Hello, ${name}` });
};

module.exports = { getMessage, postMessage };
