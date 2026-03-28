import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function callAgent() {
  const messages = [
    {
      role: "system",
      content: `You are Josh, a personal finance assistant. Your task is to assist user with their expenses, balances and financial planning.
            current datetime: ${new Date().toUTCString()}`,
    },
  ];
  messages.push({
    role: "user",
    content: "How much money i Have ?",
  });

  while (true) {
    const chatCompletion = await getGroqChatCompletion(messages);
    // Print the completion returned by the LLM.
    // console.log(
    //   "chatCompletion",
    //   chatCompletion.choices[0]?.message?.tool_calls,
    // );
    // console.log("chatCompletion_message", chatCompletion.choices[0]?.message);
    const toolCall = chatCompletion.choices[0]?.message?.tool_calls;

    messages.push(chatCompletion.choices[0]?.message);

    if (!toolCall) {
      console.log(`Assistant: ${chatCompletion.choices[0]?.message?.content}`);
      break;
    }

    for (const tool of toolCall) {
      const functionName = tool.function.name;
      const functionArgs = tool.function.arguments;
      let result = "";
      if (functionName === "getTotalExpense") {
        result = await getTotalExpense(JSON.parse(functionArgs));
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

export async function getGroqChatCompletion(messages = []) {
  return groq.chat.completions.create({
    messages: [...messages],
    model: "llama-3.3-70b-versatile",
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
    ],
  });
}

callAgent();

// Get total expense

async function getTotalExpense(fromDate = "2026-01-01", toDate = "2026-12-31") {
  console.log("Getting total expense from ", fromDate, " to ", toDate + "\n");
  return "Total expense is 1000 PKR";
}
