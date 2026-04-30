library('tidyverse')
library('jsonlite')

Exp1.df <- read.csv('../experiments/Exp1/data/jatos_results_data_batch2.csv',na.strings=c(""," ","NA")) %>%
  mutate(subj_id = substr(PROLIFIC_PID,1,10)) %>%
  mutate(subj_id = factor(subj_id)) %>%
  mutate(test_part=ifelse(test_part=='non-pretend','game',test_part)) 

Exp1.click_df <- Exp1.df %>%
  dplyr::select(condition, 
                subj_id,
                test_part, 
                grid_number, 
                num_clicks,
                click_log) %>%
  mutate(click_log = gsub("\'","\"", click_log)) %>%
  filter(test_part=='game' | test_part=='memory') %>%
  group_by(subj_id) %>%
  mutate(round=1:n())

Exp1.click_log <- data.frame(matrix(ncol=11,nrow=0,
                                    dimnames=list(NULL,
                                                  c("condition",
                                                    "subj_id",
                                                    "round",
                                                    "test_part",
                                                    "grid_number",
                                                    "num_clicks",
                                                    "i",
                                                    "j",
                                                    "hit",
                                                    "t",
                                                    "click_number"))))


for (row in 1:nrow(Exp1.click_df)) {
  
  subject_click_log <- data.frame(Filter(function(x) length(x) > 0,fromJSON(Exp1.click_df[row, ]$click_log))) %>%
    mutate(
      condition = Exp1.click_df[row, ]$condition,
      click_number = 1:n(),
      subj_id = Exp1.click_df[row, ]$subj_id,
      test_part = Exp1.click_df[row, ]$test_part,
      grid_number = Exp1.click_df[row, ]$grid_number,
      num_clicks = Exp1.click_df[row, ]$num_clicks,
      round = Exp1.click_df[row, ]$round
    )
  
  Exp1.click_log <- rbind(Exp1.click_log, subject_click_log);
}


Exp1.click_log <- Exp1.click_log %>%
  relocate(subj_id, .before = i) %>%
  relocate(round, .before = i) %>%
  relocate(test_part, .before=i) %>%
  relocate(grid_number, .before=i) %>%
  relocate(click_number, .before=i) %>%
  group_by(subj_id,test_part,grid_number) %>%
  mutate(RT=t-lag(t,default=0))   %>%
  arrange(subj_id, round, test_part, click_number) %>%
  group_by(subj_id, round, test_part) %>%
  mutate(
    mirror_miss = sapply(1:n(), function(current_row) {
      current_i <- i[current_row]
      current_j <- j[current_row]
      mirror_j <- 5 - current_j  # Mirror across j axis now
      
      # Look at all previous clicks in this round
      any(
        click_number < click_number[current_row] &
          j == mirror_j &              # Mirror j position (column)
          i == current_i &             # Same i (row)
          hit == "0"
      )
    })
  ) %>%
  ungroup() %>%
  mutate(mirror_miss = as.integer(mirror_miss))

Exp1.symmetric_participants <- Exp1.click_log %>%
  filter(condition=='symmetric') %>%
  pull(subj_id) %>% 
  unique()

Exp1.asymmetric_participants <- Exp1.click_log %>%
  filter(condition=='asymmetric') %>%
  pull(subj_id) %>% 
  unique()

Exp1.filtered_click_log <- Exp1.click_log %>%
  filter(subj_id %in% c(Exp1.asymmetric_participants[1:150],
                        Exp1.symmetric_participants[1:150]))

export_data <- read.csv('../experiments/Exp1/data/prolific_demographic_export_batch1.csv') %>%
  rbind(read.csv('../experiments/Exp1/data/prolific_demographic_export_batch2.csv')) %>%
  mutate(subj_id = substr(Participant.id,1,10)) %>%
  filter(subj_id %in% Exp1.filtered_click_log$subj_id)