document.addEventListener("DOMContentLoaded", async () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Clear and reset activity select options to avoid duplicates on refresh
      activitySelect.innerHTML = "";
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "-- Select an activity --";
      activitySelect.appendChild(defaultOption);

      // Populate activities list
  Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML (bulleted list or friendly placeholder)
          const participantsHtml =
            details.participants && details.participants.length
              ? `<ul class="participants-list">${details.participants
                  .map(
                    (p) =>
                      `<li class="participant-item"><span class="participant-email">${p}</span><button class="delete-btn" data-activity="${name}" data-email="${p}" aria-label="Remove ${p}">✖</button></li>`
                  )
                  .join("")}</ul>`
              : `<p class="no-participants">No participants yet</p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <strong>Participants</strong>
            ${participantsHtml}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities list so participants update immediately
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  await fetchActivities();

  // Delegate click handler for delete buttons on participant items
  activitiesList.addEventListener("click", async (event) => {
    const target = event.target;
    if (!target.matches(".delete-btn")) return;

    const activityName = target.dataset.activity;
    const email = target.dataset.email;

    if (!activityName || !email) return;

    // Optional: confirm removal with the user
    const confirmed = confirm(`Remove ${email} from ${activityName}?`);
    if (!confirmed) return;

    try {
      const resp = await fetch(
        `/activities/${encodeURIComponent(activityName)}/participant?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await resp.json();

      if (resp.ok) {
        // Refresh the activities list to show updated participants
        await fetchActivities();
      } else {
        alert(result.detail || "Failed to remove participant");
      }
    } catch (err) {
      console.error("Error removing participant:", err);
      alert("Failed to remove participant. Please try again.");
    }
  });
});
