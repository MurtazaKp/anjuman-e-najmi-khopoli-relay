const webhookUrl = "https://script.google.com/macros/s/AKfycbyIDecbEgjihg-k5K4Y1g9rVaAMug-FRIDKeXT2A-jibs7ToIcNVRgOatiSi5c0qAVo/exec";

const samplePayload = {
  eventName: "Urs Al-Dai Al-Ajal Syedna Mohammed Burhanuddin R.A. 1448H",
  family: {
    hofName: "Murtaza Khopoliwala",
    hofItsId: "12345678",
    mobileNumber: "9820098200",
    members: [
      {
        itsId: "12345678",
        name: "Murtaza Khopoliwala",
        status: "HOF",
        gender: "Male",
        type: "Adult",
        mobileNumber: "9820098200"
      }
    ]
  }
};

async function testFormSync() {
  console.log("Testing POST as form-urlencoded...");
  const params = new URLSearchParams();
  params.append("payload", JSON.stringify(samplePayload));

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString(),
      redirect: "follow"
    });

    console.log("Form Response Status:", res.status, res.statusText);
    const text = await res.text();
    console.log("Form Response Body (first 300 chars):", text.substring(0, 300));
  } catch (err) {
    console.error("Form Fetch Error:", err);
  }
}

testFormSync();
