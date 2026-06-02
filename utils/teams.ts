import { Team, Group } from "@/app/types"

export const groups: Group[] = [
  { id: "A", name: "Grupo A" },
  { id: "B", name: "Grupo B" },
  { id: "C", name: "Grupo C" },
  { id: "D", name: "Grupo D" },
  { id: "E", name: "Grupo E" },
  { id: "F", name: "Grupo F" },
  { id: "G", name: "Grupo G" },
  { id: "H", name: "Grupo H" },
  { id: "I", name: "Grupo I" },
  { id: "J", name: "Grupo J" },
  { id: "K", name: "Grupo K" },
  { id: "L", name: "Grupo L" },
]

export const teams: Team[] = [
  { id: "ARG", name: "Argentina", flag: "🇦🇷", groupId: "A" },
  { id: "MEX", name: "México", flag: "🇲🇽", groupId: "A" },
  { id: "NED", name: "Países Bajos", flag: "🇳🇱", groupId: "A" },
  { id: "KSA", name: "Arabia Saudita", flag: "🇸🇦", groupId: "A" },

  { id: "FRA", name: "Francia", flag: "🇫🇷", groupId: "B" },
  { id: "URU", name: "Uruguay", flag: "🇺🇾", groupId: "B" },
  { id: "NGA", name: "Nigeria", flag: "🇳🇬", groupId: "B" },
  { id: "NZL", name: "Nueva Zelanda", flag: "🇳🇿", groupId: "B" },

  { id: "ESP", name: "España", flag: "🇪🇸", groupId: "C" },
  { id: "JPN", name: "Japón", flag: "🇯🇵", groupId: "C" },
  { id: "IRN", name: "Irán", flag: "🇮🇷", groupId: "C" },
  { id: "CAN", name: "Canadá", flag: "🇨🇦", groupId: "C" },

  { id: "GER", name: "Alemania", flag: "🇩🇪", groupId: "D" },
  { id: "BRA", name: "Brasil", flag: "🇧🇷", groupId: "D" },
  { id: "CIV", name: "Costa de Marfil", flag: "🇨🇮", groupId: "D" },
  { id: "AUS", name: "Australia", flag: "🇦🇺", groupId: "D" },

  { id: "ENG", name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", groupId: "E" },
  { id: "CRO", name: "Croacia", flag: "🇭🇷", groupId: "E" },
  { id: "KOR", name: "Corea del Sur", flag: "🇰🇷", groupId: "E" },
  { id: "CRC", name: "Costa Rica", flag: "🇨🇷", groupId: "E" },

  { id: "POR", name: "Portugal", flag: "🇵🇹", groupId: "F" },
  { id: "COL", name: "Colombia", flag: "🇨🇴", groupId: "F" },
  { id: "SEN", name: "Senegal", flag: "🇸🇳", groupId: "F" },
  { id: "MAR", name: "Marruecos", flag: "🇲🇦", groupId: "F" },

  { id: "ITA", name: "Italia", flag: "🇮🇹", groupId: "G" },
  { id: "ECU", name: "Ecuador", flag: "🇪🇨", groupId: "G" },
  { id: "GHA", name: "Ghana", flag: "🇬🇭", groupId: "G" },
  { id: "SVK", name: "Eslovaquia", flag: "🇸🇰", groupId: "G" },

  { id: "BEL", name: "Bélgica", flag: "🇧🇪", groupId: "H" },
  { id: "CHI", name: "Chile", flag: "🇨🇱", groupId: "H" },
  { id: "CMR", name: "Camerún", flag: "🇨🇲", groupId: "H" },
  { id: "HUN", name: "Hungría", flag: "🇭🇺", groupId: "H" },

  { id: "SUI", name: "Suiza", flag: "🇨🇭", groupId: "I" },
  { id: "PAR", name: "Paraguay", flag: "🇵🇾", groupId: "I" },
  { id: "EGY", name: "Egipto", flag: "🇪🇬", groupId: "I" },
  { id: "IRQ", name: "Irak", flag: "🇮🇶", groupId: "I" },

  { id: "DEN", name: "Dinamarca", flag: "🇩🇰", groupId: "J" },
  { id: "USA", name: "Estados Unidos", flag: "🇺🇸", groupId: "J" },
  { id: "TUN", name: "Túnez", flag: "🇹🇳", groupId: "J" },
  { id: "PAN", name: "Panamá", flag: "🇵🇦", groupId: "J" },

  { id: "POL", name: "Polonia", flag: "🇵🇱", groupId: "K" },
  { id: "PER", name: "Perú", flag: "🇵🇪", groupId: "K" },
  { id: "ALG", name: "Argelia", flag: "🇩🇿", groupId: "K" },
  { id: "UZB", name: "Uzbekistán", flag: "🇺🇿", groupId: "K" },

  { id: "AUT", name: "Austria", flag: "🇦🇹", groupId: "L" },
  { id: "SCO", name: "Escocia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", groupId: "L" },
  { id: "JAM", name: "Jamaica", flag: "🇯🇲", groupId: "L" },
  { id: "ALB", name: "Albania", flag: "🇦🇱", groupId: "L" },
]

export function getTeamsByGroup(groupId: string): Team[] {
  return teams.filter((t) => t.groupId === groupId)
}

export function getTeamById(id: string | null): Team | undefined {
  if (!id) return undefined
  return teams.find((t) => t.id === id)
}
