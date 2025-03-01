// Function to fetch character data based on the name in the URL
function updateCharacterInfo(characterName) {
    fetch("https://raw.githubusercontent.com/GachaDB/wuthering-wave-db/refs/heads/main/Asset/Json/characters_detail.json")
      .then(response => response.json())
      .then(data => {
        const character = data.find(char => char.name.toLowerCase() === characterName.toLowerCase());
  
        if (character) {
          document.title = character.name;
          // Update header with character name and title
          document.getElementById('character-name').textContent = character.name;
          document.getElementById('character-title').textContent = character.title;
          
          document.getElementById('character-description').textContent = character.description;
  
          // Update appearance
          document.getElementById('character-image').src = `https://raw.githubusercontent.com/GachaDB/Wuthering-Waves-Assets/refs/heads/main/resonator/Character%20Model/${character.model_image}`;
          document.getElementById('appearance').textContent = character.appearance || 'No description available';
        }
      })
      .catch(err => console.error('Error loading character data:', err));
  }
  
  // Get the character name from the URL query parameter or hash
  const urlParams = new URLSearchParams(window.location.search);
  const characterName = urlParams.get('name'); // Assuming character name is passed as ?character=CharacterName
  
  if (characterName) {
    updateCharacterInfo(characterName);
  }
