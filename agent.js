import Groq from "groq-sdk";
import readline from "node:readline/promises";

const expenseDB = [];
const incomeDB = [];

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function callAgent() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const messages = [
    {
      role: "system",
      content: `You are Josh, a personal finance assistant. Your task is to assist user with their expenses, balances and financial planning.
            You have access to following tools:
            1. getTotalExpense({from, to}): string // Get total expense for a time period.
            2. addExpense({name, amount}): string // Add new expense to the expense database.
            3. addIncome({name, amount}): string // Add new income to income database.
            4. getMoneyBalance(): string // Get remaining money balance from database.
            current datetime: ${new Date().toUTCString()}`,
    },
  ];

  // for user input loop
  while (true) {
    const question = await rl.question("User : ");

    if (question.toLowerCase() === "exit") {
      break;
    }

    messages.push({
      role: "user",
      content: question,
    });

    //for agent input loop
    while (true) {
      const chatCompletion = await getGroqChatCompletion(messages);
      const toolCall = chatCompletion.choices[0]?.message?.tool_calls;

      messages.push(chatCompletion.choices[0]?.message);

      if (!toolCall) {
        console.log(
          `Assistant: ${chatCompletion.choices[0]?.message?.content}`,
        );
        break;
      }

      for (const tool of toolCall) {
        const functionName = tool.function.name;
        const functionArgs = tool.function.arguments;
        let result = "";
        if (functionName === "getTotalExpense") {
          result = await getTotalExpense(JSON.parse(functionArgs || "{}"));
        } else if (functionName === "addExpense") {
          result = await addExpense(JSON.parse(functionArgs || "{}"));
        } else if (functionName === "addIncome") {
          result = addIncome(JSON.parse(functionArgs));
        } else if (functionName === "getMoneyBalance") {
          result = getMoneyBalance(JSON.parse(functionArgs));
        }

        messages.push({
          role: "tool",
          content: result,
          tool_call_id: tool.id,
        });
        //   console.log("Result :: ", result);
      }
    }
  }
  rl.close();
}

export async function getGroqChatCompletion(messages = []) {
  return groq.chat.completions.create({
    messages: [...messages],
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,
    tools: [
      {
        type: "function",
        function: {
          name: "getTotalExpense",
          description: "Get the total expense from the user",
          parameters: {
            type: "object",
            properties: {
              fromDate: {
                type: "string",
                description: "The start date of the expense",
              },
              toDate: {
                type: "string",
                description: "The end date of the expense",
              },
            },
            // required: ["fromDate", "toDate"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "addExpense",
          description: "add new expense to db ",
          parameters: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "Name of the expense",
              },
              amount: {
                type: "string",
                description: "Amount of the expense",
              },
            },
            // required: ["fromDate", "toDate"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "addIncome",
          description: "Add new income entry to income database",
          parameters: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "Name of the income. e.g., Got salary",
              },
              amount: {
                type: "string",
                description: "Amount of the income.",
              },
            },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "getMoneyBalance",
          description: "Get remaining money balance from database.",
        },
      },
    ],
  });
}

callAgent();

// Get total expense

async function getTotalExpense({
  fromDate = "2026-01-01",
  toDate = "2026-12-31",
} = {}) {
  console.log("Getting total expense from ", fromDate, " to ", toDate + "\n");
  return "Total expense is 1000 PKR";
}

async function addExpense({ name = "", amount = "" }) {
  console.log(`Adding ${amount} to expense db for ${name}`);
  expenseDB.push({ name, amount });
  return "Added to the database.";
}

async function addIncome({ name, amount }) {
  incomeDB.push({ name, amount });
  return "Added to the income database.";
}

async function getMoneyBalance() {
  const totalIncome = incomeDB.reduce((acc, item) => acc + item.amount, 0);
  const totalExpense = expenseDB.reduce((acc, item) => acc + item.amount, 0);

  return `${totalIncome - totalExpense} INR`;
}
