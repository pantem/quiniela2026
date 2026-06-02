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
  { id: "MEX", name: "México", flag: "🇲🇽", groupId: "A" },
  { id: "RSA", name: "Sudáfrica", flag: "🇿🇦", groupId: "A" },
  { id: "KOR", name: "Corea del Sur", flag: "🇰🇷", groupId: "A" },
  { id: "CZE", name: "Chequia", flag: "🇨🇿", groupId: "A" },

  { id: "CAN", name: "Canadá", flag: "🇨🇦", groupId: "B" },
  { id: "BIH", name: "Bosnia y Herzegovina", flag: "🇧🇦", groupId: "B" },
  { id: "QAT", name: "Qatar", flag: "🇶🇦", groupId: "B" },
  { id: "SUI", name: "Suiza", flag: "🇨🇭", groupId: "B" },

  { id: "BRA", name: "Brasil", flag: "🇧🇷", groupId: "C" },
  { id: "MAR", name: "Marruecos", flag: "🇲🇦", groupId: "C" },
  { id: "HAI", name: "Haití", flag: "🇭🇹", groupId: "C" },
  { id: "SCO", name: "Escocia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", groupId: "C" },

  { id: "USA", name: "Estados Unidos", flag: "🇺🇸", groupId: "D" },
  { id: "PAR", name: "Paraguay", flag: "🇵🇾", groupId: "D" },
  { id: "AUS", name: "Australia", flag: "🇦🇺", groupId: "D" },
  { id: "TUR", name: "Turquía", flag: "🇹🇷", groupId: "D" },

  { id: "GER", name: "Alemania", flag: "🇩🇪", groupId: "E" },
  { id: "CUW", name: "Curazao", flag: "🇨🇼", groupId: "E" },
  { id: "CIV", name: "Costa de Marfil", flag: "🇨🇮", groupId: "E" },
  { id: "ECU", name: "Ecuador", flag: "🇪🇨", groupId: "E" },

  { id: "NED", name: "Países Bajos", flag: "🇳🇱", groupId: "F" },
  { id: "JPN", name: "Japón", flag: "🇯🇵", groupId: "F" },
  { id: "SWE", name: "Suecia", flag: "🇸🇪", groupId: "F" },
  { id: "TUN", name: "Túnez", flag: "🇹🇳", groupId: "F" },

  { id: "BEL", name: "Bélgica", flag: "🇧🇪", groupId: "G" },
  { id: "EGY", name: "Egipto", flag: "🇪🇬", groupId: "G" },
  { id: "IRN", name: "Irán", flag: "🇮🇷", groupId: "G" },
  { id: "NZL", name: "Nueva Zelanda", flag: "🇳🇿", groupId: "G" },

  { id: "ESP", name: "España", flag: "🇪🇸", groupId: "H" },
  { id: "CPV", name: "Cabo Verde", flag: "🇨🇻", groupId: "H" },
  { id: "KSA", name: "Arabia Saudita", flag: "🇸🇦", groupId: "H" },
  { id: "URU", name: "Uruguay", flag: "🇺🇾", groupId: "H" },

  { id: "FRA", name: "Francia", flag: "🇫🇷", groupId: "I" },
  { id: "SEN", name: "Senegal", flag: "🇸🇳", groupId: "I" },
  { id: "IRQ", name: "Irak", flag: "🇮🇶", groupId: "I" },
  { id: "NOR", name: "Noruega", flag: "🇳🇴", groupId: "I" },

  { id: "ARG", name: "Argentina", flag: "🇦🇷", groupId: "J" },
  { id: "ALG", name: "Argelia", flag: "🇩🇿", groupId: "J" },
  { id: "AUT", name: "Austria", flag: "🇦🇹", groupId: "J" },
  { id: "JOR", name: "Jordania", flag: "🇯🇴", groupId: "J" },

  { id: "POR", name: "Portugal", flag: "🇵🇹", groupId: "K" },
  { id: "COD", name: "R. D. Congo", flag: "🇨🇩", groupId: "K" },
  { id: "UZB", name: "Uzbekistán", flag: "🇺🇿", groupId: "K" },
  { id: "COL", name: "Colombia", flag: "🇨🇴", groupId: "K" },

  { id: "ENG", name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", groupId: "L" },
  { id: "CRO", name: "Croacia", flag: "🇭🇷", groupId: "L" },
  { id: "GHA", name: "Ghana", flag: "🇬🇭", groupId: "L" },
  { id: "PAN", name: "Panamá", flag: "🇵🇦", groupId: "L" },
]

export function getTeamsByGroup(groupId: string): Team[] {
  return teams.filter((t) => t.groupId === groupId)
}

export function getTeamById(id: string | null): Team | undefined {
  if (!id) return undefined
  return teams.find((t) => t.id === id)
}
